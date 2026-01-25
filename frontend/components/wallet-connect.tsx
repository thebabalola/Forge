'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from '@/components/ui/button';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">
          {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
        </span>
        <Button onClick={() => disconnect()} variant="secondary">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => connect({ connector: injected() })}>
      Connect Wallet
    </Button>
  );
}
