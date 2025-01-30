import { isEmpty } from "@/utils/string";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/utils/env";
import { Err, Ok, Result } from "@/model/utils/result";
import { getEtherContractWithSigner } from "@/abis";
import { JsonRpcProvider, Wallet } from "ethers";
import getProviderApiUrlFromEnv from "@/utils/api/providerApiUrl";
import { IRentalityGatewayContract } from "@/features/blockchain/models/IRentalityGateway";

export type UpdateCivicRequest = {
  chainId: number;
  address: string;
};

export type UpdateCivicResponse =
  | {
      success: true;
    }
  | {
      error: string;
    };

export default async function handler(req: NextApiRequest, res: NextApiResponse<UpdateCivicResponse>) {
  const MANAGER_PRIVATE_KEY = env.MANAGER_PRIVATE_KEY;
  if (isEmpty(MANAGER_PRIVATE_KEY)) {
    console.error("updateCivic error: private key was not set");
    res.status(500).json({ error: getErrorMessage("private key was not set") });
    return;
  }

  const { chainId: chainIdQuery, address: addressQuery } = req.query;
  const address = typeof addressQuery === "string" ? addressQuery : "";

  if (isEmpty(address)) {
    res.status(400).json({ error: "'address' is not provided or empty" });
    return;
  }

  const chainId =
    typeof chainIdQuery === "string" && !isEmpty(chainIdQuery) && Number(chainIdQuery) > 0 ? Number(chainIdQuery) : 0;
  if (!chainId) {
    console.error("updateCivic error: chainId was not provided");
    res.status(400).json({ error: "chainId was not provided" });
    return;
  }

  // const providerApiUrl = process.env[`NEXT_PUBLIC_PROVIDER_API_URL_${chainId}`];
  const providerApiUrl = getProviderApiUrlFromEnv(chainId);

  if (!providerApiUrl) {
    console.error(`updateCivic error: API URL for chain id ${chainId} was not set`);
    res.status(500).json({ error: getErrorMessage(`updateCivic error: API URL for chain id ${chainId} was not set`) });
    return;
  }

  console.log(`\nCalling updateCivic API with address:${address} and chainId:${chainId}`);

  const resetUserKycCommissionResult = await resetUserKycCommission(address, providerApiUrl, MANAGER_PRIVATE_KEY);

  if (!resetUserKycCommissionResult.ok) {
    res
      .status(500)
      .json({ error: getErrorMessage(`resetUserKycCommissionResult error: ${resetUserKycCommissionResult.error}`) });
    return;
  }
  console.log(`User KYC Commission was reset successfully`);

  res.status(200).json({
    success: true,
  });
  return;
}

async function resetUserKycCommission(
  address: string,
  providerApiUrl: string,
  privateKey: string
): Promise<Result<boolean, string>> {
  if (isEmpty(address)) {
    console.error("address is empty");
    return Err("address is empty");
  }

  const provider = new JsonRpcProvider(providerApiUrl);
  const wallet = new Wallet(privateKey, provider);

  const rentality = (await getEtherContractWithSigner("gateway", wallet)) as unknown as IRentalityGatewayContract;

  if (rentality === null) {
    console.error("rentality is null");
    return Err("rentality is null");
  }
  try {
    const transaction = await rentality.useKycCommission(address);
    await transaction.wait();
    return Ok(true);
  } catch (e) {
    console.error("useKycCommission error", e);
    return Err(`useKycCommission error ${e}`);
  }
}

function getErrorMessage(debugMessage: string) {
  const isDebug = true;
  return isDebug ? debugMessage : "Something went wrong! Please wait a few minutes and try again";
}
