'use client';

import React from 'react';
import { useVaultFactory } from '@/hooks/useVaultFactory';
import { VaultCard } from '@/components/vaults/VaultCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { userVaults, isLoadingVaults } = useVaultFactory();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Vaults</h1>
          <p className="text-muted-foreground mt-1">Manage your automated yield strategies.</p>
        </div>
        <Link href="/create">
          <Button>Create Vault</Button>
        </Link>
      </div>

      {isLoadingVaults ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] rounded-xl border bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : userVaults && userVaults.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {userVaults.map((vaultAddress) => (
            <VaultCard key={vaultAddress} address={vaultAddress} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 rounded-xl border border-dashed">
          <h2 className="text-xl font-semibold">No vaults found</h2>
          <p className="text-muted-foreground mt-2">Get started by creating your first automated vault.</p>
          <Link href="/create" className="inline-block mt-4">
            <Button variant="outline">Create Vault</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
