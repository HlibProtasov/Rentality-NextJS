import { useEthereum } from "@/contexts/web3/ethereumContext";
import { Err, Ok, Result } from "@/model/utils/result";
import { useRentality } from "@/contexts/rentalityContext";
import { create } from "zustand";
import { useCallback, useEffect } from "react";

interface ClaimMyPointsState {
  isLoading: boolean;
  readyToClaim: number;
  setReadyToClaim: (value: number) => void;
  setLoadingState: () => void;
}

const useClaimMyPointsStore = create<ClaimMyPointsState>((set) => ({
  isLoading: true,
  readyToClaim: 0,
  setReadyToClaim: (value) => set({ readyToClaim: value, isLoading: false }),
  setLoadingState: () => set({ isLoading: true }),
}));

function useClaimMyPointsContractActions() {
  const ethereumInfo = useEthereum();
  const { rentalityContracts } = useRentality();

  const fetchReadyToClaim = useCallback(async (): Promise<Result<number, Error>> => {
    if (!rentalityContracts) {
      console.error("fetchReadyToClaim error: rentalityContract is null");
      return Err(new Error("rentalityContract is null"));
    }
    if (!ethereumInfo) {
      console.error("fetchReadyToClaim error: ethereum info is null");
      return Err(new Error("ethereum is null"));
    }

    const result = await rentalityContracts.referralProgram.getReadyToClaim(ethereumInfo.walletAddress);

    if (result.ok) {
      return Ok(Number(result.value.totalPoints));
    } else {
      return Err(new Error("fetch error:" + result.error));
    }
  }, [ethereumInfo, rentalityContracts]);

  const claimMyPoints = useCallback(async (): Promise<Result<boolean, Error>> => {
    if (!rentalityContracts) {
      console.error("claimMyPoints error: rentalityContract is null");
      return Err(new Error("contract is null"));
    }
    if (!ethereumInfo) {
      console.error("claimMyPoints error: ethereum info is null");
      return Err(new Error("ethereum info is null"));
    }

    const result = await rentalityContracts.referralProgram.claimPoints(ethereumInfo.walletAddress);
    if (result.ok) {
      return result;
    } else {
      return Err(new Error("claimMyPoints error: " + result.error));
    }
  }, [ethereumInfo, rentalityContracts]);

  return { fetchReadyToClaim, claimMyPoints } as const;
}

function useClaimMyPoints() {
  const isLoading = useClaimMyPointsStore((state) => state.isLoading);
  const readyToClaim = useClaimMyPointsStore((state) => state.readyToClaim);
  const setReadyToClaim = useClaimMyPointsStore((state) => state.setReadyToClaim);
  const setLoadingState = useClaimMyPointsStore((state) => state.setLoadingState);
  const { fetchReadyToClaim, claimMyPoints } = useClaimMyPointsContractActions();

  const claimMyPointsImpl = useCallback(async () => {
    setLoadingState();

    const claimResult = await claimMyPoints();

    if (!claimResult.ok) {
      setReadyToClaim(readyToClaim);
      return claimResult;
    }

    const fetchResult = await fetchReadyToClaim();

    if (fetchResult.ok) {
      setReadyToClaim(fetchResult.value);
    }

    return claimResult;
  }, [claimMyPoints, fetchReadyToClaim, setReadyToClaim, setLoadingState, readyToClaim]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchReadyToClaim();

      if (result.ok) {
        setReadyToClaim(result.value);
      }
    };

    fetchData();
  }, [fetchReadyToClaim, setReadyToClaim]);

  return { isLoading, readyToClaim, claimMyPoints: claimMyPointsImpl } as const;
}

export default useClaimMyPoints;
