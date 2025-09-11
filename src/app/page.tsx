'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function Home() {
  const [isReady, setIsReady] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    const initializeSdk = async () => {
      try {
        await sdk.actions.ready();
        setIsReady(true);

        // Get user context if available
        const context = await sdk.context;
        if (context?.user?.fid) {
          console.log('Farcaster user context:', context);
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };
    initializeSdk();
  }, []);

  const connectWallet = async () => {
    try {
      // This will be implemented with Base Account SDK for spend permissions
      console.log('Connecting wallet for spend permissions...');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const requestSpendPermission = async () => {
    try {
      // This will be implemented to request spend permissions from Base Account SDK
      console.log('Requesting spend permission...');
    } catch (error) {
      console.error('Failed to request spend permission:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            AI Spend Permissions
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
            Grant AI agents access to your funds securely using Base Account SDK
          </p>
          {!isReady && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Initializing Farcaster Mini App...
            </p>
          )}
        </header>

        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
              🔗 Wallet Connection
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Connect your wallet to grant spend permissions to AI agents
            </p>
            <button
              onClick={connectWallet}
              disabled={!isReady}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Connect Wallet
            </button>
          </div>

          {/* Spend Permissions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
              💰 Grant Spend Permission
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Allow AI agents to spend from your account for automated transactions
            </p>
            <button
              onClick={requestSpendPermission}
              disabled={!isReady || !userAddress}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Grant Permission
            </button>
          </div>

          {/* Debug Info */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-6 border border-cyan-200 dark:border-cyan-800">
            <h3 className="text-lg font-semibold text-cyan-800 dark:text-cyan-200 mb-3">
              🐛 Debug Info
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-cyan-700 dark:text-cyan-300">
                <strong>Farcaster Ready:</strong> {isReady ? '✅' : '⏳'}
              </p>
              <p className="text-cyan-700 dark:text-cyan-300">
                <strong>Wallet Address:</strong> {userAddress || 'Not connected'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
