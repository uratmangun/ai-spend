'use client';

import { useEffect, useState } from 'react';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export default function DebugPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  // When user clicks switch while disconnected, remember target and switch after connect
  const [pendingTargetChainId, setPendingTargetChainId] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && pendingTargetChainId) {
      try {
        switchChain({ chainId: pendingTargetChainId });
      } catch (err) {
        console.error('Auto-switch after connect failed:', err);
      } finally {
        setPendingTargetChainId(null);
      }
    }
  }, [isConnected, pendingTargetChainId, switchChain]);

  const chainNames: Record<number, string> = {
    [baseSepolia.id]: baseSepolia.name,
    [base.id]: base.name,
  };
  const chainName = isConnected
    ? (chainNames[chainId] ?? (chainId ? `Chain ID ${chainId}` : 'Unknown'))
    : 'Not connected';

  const handleSwitchToBase = () => {
    if (!isConnected) {
      setPendingTargetChainId(base.id);
      openConnectModal?.();
      return;
    }
    try {
      switchChain({ chainId: base.id });
    } catch (err) {
      console.error('Failed to switch to Base:', err);
    }
  };

  const handleSwitchToBaseSepolia = () => {
    if (!isConnected) {
      setPendingTargetChainId(baseSepolia.id);
      openConnectModal?.();
      return;
    }
    try {
      switchChain({ chainId: baseSepolia.id });
    } catch (err) {
      console.error('Failed to switch to Base Sepolia:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Debug Dashboard</h1>
        </header>

        <div className="space-y-8">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">Base Authentication Test</h2>
            <div className="space-y-4">
              <div>
                <ConnectButton label="Connect Wallet" />
                <p className="mt-2 text-sm text-slate-300">
                  Network: <span className="font-medium">{chainName}</span>
                </p>
                <button
                  type="button"
                  onClick={handleSwitchToBase}
                  disabled={!isConnected || chainId === base.id || isSwitching}
                  className="mt-2 inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white px-4 py-2 rounded transition-colors text-sm"
                >
                  {isSwitching ? 'Switching…' : 'Switch to Base'}
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToBaseSepolia}
                  disabled={!isConnected || chainId === baseSepolia.id || isSwitching}
                  className="mt-2 ml-2 inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white px-4 py-2 rounded transition-colors text-sm"
                >
                  {isSwitching ? 'Switching…' : 'Switch to Base Sepolia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}