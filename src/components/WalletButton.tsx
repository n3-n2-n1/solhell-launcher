'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Flame, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WalletButton() {
  const { connected, disconnect, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDisconnect = () => {
    disconnect();
  };

  // Evitar hidratación mismatch
  if (!mounted) {
    return (
      <button className="hell-button px-6 py-3 flex items-center space-x-2">
        <Flame className="h-4 w-4" />
        <span>Connect</span>
      </button>
    );
  }

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 hell-glass px-4 py-2 rounded-lg border border-red-500/30">
          <div className="p-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-orange-200">
            {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-6)}
          </span>
          <Zap className="h-3 w-3 text-yellow-400 animate-pulse" />
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 hell-button px-4 py-2 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <WalletMultiButton className="!hell-button !px-6 !py-3 !flex !items-center !space-x-2" />
  );
}
