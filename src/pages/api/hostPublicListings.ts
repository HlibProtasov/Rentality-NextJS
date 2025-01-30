import { getEtherContractWithSigner } from "@/abis";
import { IRentalityGatewayContract } from "@/features/blockchain/models/IRentalityGateway";
import { BaseCarInfo } from "@/model/BaseCarInfo";
import { ContractPublicHostCarDTO } from "@/model/blockchain/schemas";
import { validateContractPublicHostCarDTO } from "@/model/blockchain/schemas_utils";
import getProviderApiUrlFromEnv from "@/utils/api/providerApiUrl";
import { env } from "@/utils/env";
import { getIpfsURI, getMetaDataFromIpfs, parseMetaData } from "@/utils/ipfsUtils";
import { isEmpty } from "@/utils/string";
import { JsonRpcProvider, Provider, Wallet } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

const validateWalletAddress = (value: string) => {
  return !isEmpty(value) && value.length === 42 && value.toLowerCase().startsWith("0x");
};
const getHostAddressFromQuery = async (query: string | string[] | undefined, provider: Provider) => {
  if (!query || typeof query !== "string") return null;
  if (validateWalletAddress(query)) return query;

  try {
    return await provider.resolveName(query);
  } catch (error) {
    return null;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const privateKey = env.SIGNER_PRIVATE_KEY;
  if (isEmpty(privateKey)) {
    console.error("API hostPublicListings error: private key was not set");
    res.status(500).json({ error: "private key was not set" });
    return;
  }

  const { chainId, host: hostQuery } = req.query;

  const chainIdNumber = Number(chainId) > 0 ? Number(chainId) : env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
  if (!chainIdNumber) {
    console.error("API hostPublicListings error: chainId was not provided");
    res.status(400).json({ error: "chainId was not provided" });
    return;
  }

  // const providerApiUrl = process.env[`NEXT_PUBLIC_PROVIDER_API_URL_${chainIdNumber}`];
  const providerApiUrl = getProviderApiUrlFromEnv(chainIdNumber);

  if (!providerApiUrl) {
    console.error(`API hostPublicListings error: API URL for chain id ${chainIdNumber} was not set`);
    res.status(500).json({ error: `API hostPublicListings error: API URL for chain id ${chainIdNumber} was not set` });
    return;
  }

  const provider = new JsonRpcProvider(providerApiUrl);
  const hostAddress = await getHostAddressFromQuery(hostQuery, provider);

  if (!hostAddress || isEmpty(hostAddress)) {
    console.error("API hostPublicListings error: hostAddress was not provided");
    res.status(400).json({ error: "hostAddress was not provided" });
    return;
  }

  console.log(`\nCalling hostPublicListings API for ${chainIdNumber} chain id and ${hostAddress} host...`);

  const wallet = new Wallet(privateKey, provider);
  try {
    const rentality = (await getEtherContractWithSigner("gateway", wallet)) as unknown as IRentalityGatewayContract;

    const hostPublicListingsView: ContractPublicHostCarDTO[] = await rentality.getCarsOfHost(hostAddress);

    const hostPublicListingsData =
      hostPublicListingsView.length === 0
        ? []
        : await Promise.all(
            hostPublicListingsView.map(async (i: ContractPublicHostCarDTO, index) => {
              if (index === 0) {
                validateContractPublicHostCarDTO(i);
              }
              const metaData = parseMetaData(await getMetaDataFromIpfs(i.metadataURI));

              const pricePerDay = Number(i.pricePerDayInUsdCents) / 100;
              const securityDeposit = Number(i.securityDepositPerTripInUsdCents) / 100;
              const milesIncludedPerDay = Number(i.milesIncludedPerDay);

              const item: BaseCarInfo = {
                carId: Number(i.carId),
                ownerAddress: hostAddress,
                image: getIpfsURI(metaData.mainImage),
                brand: i.brand,
                model: i.model,
                year: i.yearOfProduction.toString(),
                licensePlate: metaData.licensePlate,
                pricePerDay: pricePerDay,
                securityDeposit: securityDeposit,
                milesIncludedPerDay: milesIncludedPerDay,
                currentlyListed: i.currentlyListed,
                isEditable: false,
              };
              return item;
            })
          );

    res.status(200).json(hostPublicListingsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during blockchain method call" });
  }
}
