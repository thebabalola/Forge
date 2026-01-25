'use client';

import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import VaultFactoryABI from '@/lib/abi/VaultFactory.json';

const VAULT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS as `0x${string}`;

export function useVaultFactory() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: userVaults, isLoading: isLoadingVaults, refetch: refetchVaults } = useReadContract({
    address: VAULT_FACTORY_ADDRESS,
    abi: VaultFactoryABI,
    functionName: 'getUserVaults',
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  const createVault = async (asset: `0x${string}`, name: string, symbol: string) => {
    return await writeContractAsync({
      address: VAULT_FACTORY_ADDRESS,
      abi: VaultFactoryABI,
      functionName: 'createVault',
      args: [asset, name, symbol],
    });
  };

  return {
    userVaults: userVaults as `0x${string}`[] | undefined,
    isLoadingVaults,
    refetchVaults,
    createVault,
  };
}
