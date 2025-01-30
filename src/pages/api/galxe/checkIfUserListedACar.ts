import { getEtherContractWithSigner } from "@/abis";
import { IRentalityGatewayContract } from "@/features/blockchain/models/IRentalityGateway";
import { ContractPublicHostCarDTO } from "@/model/blockchain/schemas";
import { env } from "@/utils/env";
import { isEmpty } from "@/utils/string";
import { JsonRpcProvider, Wallet } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

type CheckIfUserListedACarResponse =
  | {
      cars_listed: number;
    }
  | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<CheckIfUserListedACarResponse>) {
  if (req.method === "OPTIONS") {
    res
      .status(200)
      .setHeader("Allow", "OPTIONS, GET")
      .setHeader("Access-Control-Allow-Origin", "https://dashboard.galxe.com")
      .setHeader("Access-Control-Allow-Methods", "GET")
      .json({ error: "" });
    return;
  }

  const privateKey = env.SIGNER_PRIVATE_KEY;
  if (isEmpty(privateKey)) {
    console.error("API checkIfUserListedACar error: private key was not set");
    res.status(500).json({ error: "private key was not set" });
    return;
  }

  const chainId = env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
  if (!chainId) {
    console.error("API checkIfUserListedACar error: chainId was not set");
    res.status(500).json({ error: "chainId was not set" });
    return;
  }

  const providerApiUrl = process.env[`PROVIDER_API_URL_${chainId}`];
  if (!providerApiUrl) {
    console.error(`API checkIfUserListedACar error: API URL for chain id ${chainId} was not set`);
    res.status(500).json({ error: `API URL for chain id ${chainId} was not set` });
    return;
  }

  if (req.method !== "GET") {
    res.status(400).json({ error: "Only GET methods are allowed" });
    return;
  }

  const { address: addressQuery } = req.query;

  const userAddress = getAddressFromQuery(addressQuery);
  if (!userAddress || isEmpty(userAddress)) {
    console.error("API checkIfUserListedACar error: userAddress was not provided");
    res.status(400).json({ error: "userAddress was not provided" });
    return;
  }

  console.log(`\nCalling checkIfUserListedACar API for user ${userAddress}...`);

  try {
    const provider = new JsonRpcProvider(providerApiUrl);
    const wallet = new Wallet(privateKey, provider);
    const rentality = (await getEtherContractWithSigner("gateway", wallet)) as unknown as IRentalityGatewayContract;

    const userListingsView: ContractPublicHostCarDTO[] = await rentality.getCarsOfHost(userAddress);

    res
      .status(200)
      .setHeader("Access-Control-Allow-Origin", "https://dashboard.galxe.com")
      .setHeader("Access-Control-Allow-Methods", "GET")
      .json({ cars_listed: userListingsView.length });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during blockchain method call" });
    return;
  }
}

const validateWalletAddress = (value: string) => {
  return !isEmpty(value) && value.length === 42 && value.toLowerCase().startsWith("0x");
};

const getAddressFromQuery = (query: string | string[] | undefined) => {
  if (!query || typeof query !== "string" || !validateWalletAddress(query)) return null;
  return query;
};
