'use client';

import { useState } from 'react';
import { SignInWithBaseButton } from '../../components/SignInWithBase';

export default function DebugPage() {
  const [userAddress, setUserAddress] = useState<string>('');

  const handleSignIn = (address: string) => {
    setUserAddress(address);
    console.log('User signed in with address:', address);
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
              <SignInWithBaseButton 
                onSignIn={handleSignIn} 
                colorScheme="dark"
              />
              {userAddress && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded">
                  <p className="text-green-400">
                    ✅ Signed in as: <code className="bg-slate-700 px-2 py-1 rounded text-xs">{userAddress}</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}