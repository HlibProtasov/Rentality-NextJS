import RentalityGatewayJSON_ABI from "./RentalityGateway.v0_2_0.abi.json";
import RentalityGatewayJSON_ADDRESSES from "./RentalityGateway.v0_2_0.addresses.json";
import RentalityAdminGatewayJSON_ABI from "./RentalityAdminGateway.v0_2_0.abi.json";
import RentalityAdminGatewayJSON_ADDRESSES from "./RentalityAdminGateway.v0_2_0.addresses.json";
import RentalityLocationVerifierJSON_ADDRESSES from "./RentalityLocationVerifier.v0_2_0.addresses.json";
import RentalityLocationVerifierJSON_ABI from "./RentalityLocationVerifier.v0_2_0.abi.json";
import RentalityNotificationServiceJSON_ADDRESSES from "./RentalityNotificationService.v0_2_0.addresses.json";
import RentalityNotificationServiceJSON_ABI from "./RentalityNotificationService.v0_2_0.abi.json";
import RentalityReferralProgramServiceJSON_ABI from "./RentalityReferralProgram.v0_2_0.abi.json";
import RentalityReferralProgramServiceJSON_ADDRESSES from "./RentalityReferralProgram.v0_2_0.addresses.json";
import RentalityMotionsCloudJSON_ABI from "./RentalityMotionsCloud.v0_2_0.abi.json";
import RentalityMotionsCloudServiceJSON_ADDRESSES from "./RentalityMotionsCloud.v0_2_0.addresses.json";
import { Contract, Signer } from "ethers";
import { getExistBlockchainList } from "@/model/blockchain/blockchainList";

export const SMARTCONTRACT_VERSION = "v0_2_0";

const rentalityContracts = {
  gateway: {
    addresses: RentalityGatewayJSON_ADDRESSES.addresses,
    abi: RentalityGatewayJSON_ABI.abi,
  },
  admin: {
    addresses: RentalityAdminGatewayJSON_ADDRESSES.addresses,
    abi: RentalityAdminGatewayJSON_ABI.abi,
  },
  notificationService: {
    addresses: RentalityNotificationServiceJSON_ADDRESSES.addresses,
    abi: RentalityNotificationServiceJSON_ABI.abi,
  },
  verifierService: {
    addresses: RentalityLocationVerifierJSON_ADDRESSES.addresses,
    abi: RentalityLocationVerifierJSON_ABI.abi,
  },
  referralProgram: {
    addresses: RentalityReferralProgramServiceJSON_ADDRESSES.addresses,
    abi: RentalityReferralProgramServiceJSON_ABI.abi,
  },
  motionsCloud: {
    addresses: RentalityMotionsCloudServiceJSON_ADDRESSES.addresses,
    abi: RentalityMotionsCloudJSON_ABI.abi,
  }
};

export async function getEtherContractWithSigner(contract: keyof typeof rentalityContracts, signer: Signer) {
  try {
    if (!signer) {
      console.error("getEtherContract error: signer is null");
      return null;
    }

    const chainId = Number((await signer.provider?.getNetwork())?.chainId);
    if (!getExistBlockchainList().find((i) => i.chainId === chainId)) {
      console.error(`getEtherContract error: Chain id ${chainId} is not supported`);
      return null;
    }

    const selectedChain = rentalityContracts[contract].addresses.find((i) => i.chainId === chainId);

    if (!selectedChain) {
      console.error(`getEtherContract error: ${contract} address for chainId ${chainId} is not found`);
      return null;
    }
    const etherContract = new Contract(selectedChain.address, rentalityContracts[contract].abi, signer);
    return etherContract;
  } catch (e) {
    console.error("getEtherContract error:" + e);
    return null;
  }
}

export function hasContractForChainId(chainId: number) {
  return rentalityContracts.gateway.addresses.find((i) => i.chainId === chainId) !== undefined;
}

export function getContractAddress(contract: keyof typeof rentalityContracts, chainId: number) {
  try {
    if (!getExistBlockchainList().find((i) => i.chainId === chainId)) {
      console.error(`getEtherContract error: Chain id ${chainId} is not supported`);
      return null;
    }

    const selectedChain = rentalityContracts[contract].addresses.find((i) => i.chainId === chainId);

    if (!selectedChain) {
      console.error(`getEtherContract error: ${contract} address for chainId ${chainId} is not found`);
      return null;
    }
    return selectedChain.address;
  } catch (e) {
    console.error("get address error error:" + e);
    return null;
  }
}

export default rentalityContracts;
