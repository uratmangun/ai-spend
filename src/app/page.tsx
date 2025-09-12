'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export default function Home() {
  const [isReady, setIsReady] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const [pendingTargetChainId, setPendingTargetChainId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([
    { id: 'welcome', role: 'assistant', content: '👋 Hi! Ask me about spend permissions or Base today.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [selectedChat, setSelectedChat] = useState<'default' | 'new'>('default');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Auto-switch to desired network after connecting
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

  // Auto-hide sidebar on small screens and update on viewport changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsSidebarOpen(!mql.matches);
    // Initialize on mount
    apply();
    // Subscribe to changes
    if (mql.addEventListener) {
      mql.addEventListener('change', apply);
    } else {
      // Safari/legacy fallback
      // @ts-ignore
      mql.addListener(apply);
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', apply);
      } else {
        // @ts-ignore
        mql.removeListener(apply);
      }
    };
  }, []);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    // Demo assistant echo
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: '✅ Received! (demo reply)' },
      ]);
    }, 300);
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
          {/* Base Authentication Test (from /debug) */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-3">
              Base Authentication Test
            </h3>
            <div className="space-y-4">
              <div>
                <ConnectButton label="Connect Wallet" />
                <p className="mt-2 text-sm text-slate-300">
                  Network: <span className="font-medium">{chainName}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-cyan-400">
                Chat
              </h3>
              <button
                type="button"
                onClick={() => setIsSidebarOpen((v) => !v)}
                className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 text-sm"
                aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                aria-pressed={isSidebarOpen}
              >
                {isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              </button>
            </div>
            <div className="flex gap-4 overflow-hidden md:overflow-visible items-stretch">
              <aside
                className={`${isSidebarOpen ? 'block w-56' : 'hidden w-0'} md:block md:w-56 shrink-0 bg-slate-900/40 border border-slate-700 rounded-md p-3 transition-all duration-200`}
                aria-hidden={!isSidebarOpen}
              >
                <h4 className="text-sm font-semibold text-slate-200 mb-2">Conversations</h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChat('default')}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedChat === 'default' ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setSelectedChat('new');
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedChat === 'new' ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                  >
                    New chat
                  </button>
                </div>
              </aside>
              <section className="flex-1 min-w-0 min-h-[320px] flex flex-col">
                <div className="flex-1 min-w-0 overflow-auto border border-slate-700 rounded-md p-3 bg-slate-900/40 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-sm text-slate-400">Start the conversation below…</p>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[85%] px-3 py-2 rounded-md text-sm ${m.role === 'user' ? 'ml-auto bg-cyan-600 text-white' : 'mr-auto bg-slate-700 text-slate-100'}`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSend} className="mt-3 flex gap-2 min-w-0">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium"
                  >
                    Send
                  </button>
                </form>
              </section>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
