import { ContractResultWrapper } from "../types";
import { ContractTransactionResponse } from "ethers";
import { Err, Ok } from "@/model/utils/result";
import { IEthersContract } from "./IEtherContract";

export function getEthersContractProxy<T extends IEthersContract>(contract: T): ContractResultWrapper<T> {
  return new Proxy(contract, {
    get(target, key, receiver) {
      const originalMethod = Reflect.get(target, key, receiver);

      if (typeof originalMethod !== "function") {
        return originalMethod;
      }

      console.debug(`${key.toString()} proxy function called`);

      return async (...args: any[]) => {
        try {
          const result = await originalMethod.apply(target, args);

          if (isContractTransactionResponse(result)) {
            console.debug("proxy function return ContractTransactionResponse");
            await result.wait();
            return Ok(true);
          }

          return Ok(result);
        } catch (error) {
          console.error(`${key.toString()} proxy function error:`, error);
          return Err(error);
        }
      };
    },
  }) as ContractResultWrapper<T>;
}

function isContractTransactionResponse(obj: any): obj is ContractTransactionResponse {
  return (
    obj &&
    typeof obj === "object" &&
    "provider" in obj &&
    "chainId" in obj &&
    "wait" in obj &&
    typeof obj.wait === "function"
  );
}
