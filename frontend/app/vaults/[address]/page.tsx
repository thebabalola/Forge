'use client';

import React, { useState, use } from 'react';
import { useUserVault } from '@/hooks/useUserVault';
import { Button } from '@/components/ui/button';
import { ProtocolAllocationManager } from '@/components/vaults/ProtocolAllocationManager';
import { ShareTransfer } from '@/components/vaults/ShareTransfer';
import { formatUnits, parseUnits } from 'viem';

export default function VaultPage({ params }: { params: Promise<{ address: string }> }) {
  const resolvedParams = use(params);
  const vaultAddress = resolvedParams.address as `0x${string}`;
  const { totalAssets, userBalance, deposit, withdraw } = useUserVault(vaultAddress);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    setIsLoading(true);
    try {
      await deposit(parseUnits(amount, 18));
      alert('Deposit successful!');
    } catch (error) {
      console.error(error);
      alert('Deposit failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      await withdraw(parseUnits(amount, 18));
      alert('Withdrawal successful!');
    } catch (error) {
      console.error(error);
      alert('Withdrawal failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Vault</h1>
        <p className="text-muted-foreground break-all">{vaultAddress}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Card */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-6 bg-card shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Total Assets in Vault</p>
              <p className="text-2xl font-bold">{totalAssets ? formatUnits(totalAssets, 18) : '0.00'}</p>
            </div>
            <div className="rounded-xl border p-6 bg-card shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Your Share Balance</p>
              <p className="text-2xl font-bold">{userBalance ? formatUnits(userBalance, 18) : '0.00'}</p>
            </div>
          </div>

          {/* Deposit/Withdraw Card */}
          <div className="rounded-xl border p-6 bg-card shadow-sm space-y-6">
            <h3 className="text-xl font-bold">Deposit / Withdraw</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleDeposit} disabled={isLoading} size="lg">
                  {isLoading ? 'Processing...' : 'Deposit'}
                </Button>
                <Button onClick={handleWithdraw} disabled={isLoading} variant="outline" size="lg">
                  {isLoading ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <ProtocolAllocationManager vaultAddress={vaultAddress} />
          <ShareTransfer vaultAddress={vaultAddress} />
        </div>
      </div>
    </div>
  );
}
