'use client';

import { useEffect, useMemo, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useChat } from '@ai-sdk/react';

// Simple IndexedDB helpers for persisting chats
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };
type Chat = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const DB_NAME = 'ai-spend-chat-db';
const STORE_NAME = 'kv';

async function idbGet<T = any>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    };
    open.onerror = () => reject(open.error);
  });
}

async function idbSet<T = any>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value as any, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    };
    open.onerror = () => reject(open.error);
  });
}

export default function Home() {
  const [isReady, setIsReady] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const [pendingTargetChainId, setPendingTargetChainId] = useState<number | null>(null);
  const [chats, setChats] = useState<Record<string, Chat>>({});
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [model, setModel] = useState<string>('openai/gpt-5');

  // Initialize AI chat hook for streaming; tie to selected chat and current model
  const initialUiMessages = useMemo(() => {
    const msgs = chats[selectedChatId]?.messages ?? [];
    return msgs.map((m) => ({
      id: m.id,
      role: m.role as any,
      parts: [{ type: 'text', text: m.content }],
    }));
  }, [selectedChatId, chats]);

  const { messages: uiMessages, sendMessage, isLoading, stop } = useChat({
    id: selectedChatId || 'default',
    api: '/api/chat',
    body: { model },
    initialMessages: initialUiMessages as any,
  });

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

  // Initialize chats from IndexedDB (or seed a default chat)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const savedChats = await idbGet<Record<string, Chat>>('chats');
        const savedSelected = await idbGet<string>('selectedChatId');
        if (!cancelled && savedChats && Object.keys(savedChats).length > 0) {
          setChats(savedChats);
          const fallbackId = Object.keys(savedChats)[0];
          setSelectedChatId(savedSelected && savedChats[savedSelected] ? savedSelected : fallbackId);
        } else if (!cancelled) {
          const defaultId = 'default';
          const defaultChat: Chat = {
            id: defaultId,
            title: 'Default',
            messages: [
              { id: 'welcome', role: 'assistant', content: '👋 Hi! Ask me about spend permissions or Base today.' },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const initial = { [defaultId]: defaultChat } as Record<string, Chat>;
          setChats(initial);
          setSelectedChatId(defaultId);
          await idbSet('chats', initial);
          await idbSet('selectedChatId', defaultId);
        }
      } catch (e) {
        console.error('Failed to load chats from IndexedDB', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist chats and selected chat id to IndexedDB
  useEffect(() => {
    if (!selectedChatId || Object.keys(chats).length === 0) return;
    idbSet('chats', chats).catch((e) => console.error('Failed to persist chats', e));
    idbSet('selectedChatId', selectedChatId).catch((e) => console.error('Failed to persist selected chat id', e));
  }, [chats, selectedChatId]);

  const createAndSelectNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const idx = Object.keys(chats).length + 1;
    const newChat: Chat = {
      id: newId,
      title: `Chat ${idx}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => ({ ...prev, [newId]: newChat }));
    setSelectedChatId(newId);
  };

  const startRenameChat = (id: string) => {
    const current = chats[id];
    setEditingChatId(id);
    setEditingTitle(current?.title ?? '');
  };

  const cancelRename = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const commitRename = () => {
    if (!editingChatId) return;
    const newTitle = editingTitle.trim() || 'Untitled';
    setChats((prev) => {
      const chat = prev[editingChatId!];
      if (!chat) return prev;
      const updated: Chat = { ...chat, title: newTitle, updatedAt: Date.now() };
      return { ...prev, [editingChatId!]: updated };
    });
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  const deleteChat = (id: string) => {
    setChats((prev) => {
      const newChats = { ...prev };
      delete newChats[id];

      let nextId = selectedChatId;
      if (id === selectedChatId) {
        const remainingList = Object.values(newChats).sort((a, b) => b.updatedAt - a.updatedAt);
        nextId = remainingList[0]?.id ?? '';
      }

      if (!nextId) {
        const defaultId = 'default';
        const defaultChat: Chat = {
          id: defaultId,
          title: 'Default',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        newChats[defaultId] = defaultChat;
        setSelectedChatId(defaultId);
      } else if (id === selectedChatId) {
        setSelectedChatId(nextId);
      }

      return newChats;
    });

    if (editingChatId === id) {
      setEditingChatId(null);
      setEditingTitle('');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !selectedChatId) return;
    try {
      await sendMessage({ text });
    } catch (err) {
      console.error('sendMessage failed', err);
    } finally {
      setChatInput('');
    }
  };

  // Sync streamed UI messages into our local chat store for display/persistence
  useEffect(() => {
    if (!selectedChatId) return;
    if (!uiMessages || uiMessages.length === 0) return;
    const converted: ChatMessage[] = (uiMessages as any[]).map((m: any, idx: number) => {
      const parts: any[] = m.parts ?? (m.content ? [{ type: 'text', text: m.content }] : []);
      let content = '';
      for (const p of parts) {
        if (p?.type === 'text' && typeof p.text === 'string') content += p.text;
        else if (p) content += `\n[${p.type}] ${JSON.stringify(p)}\n`;
      }
      const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';
      return { id: String(m.id ?? `ui-${idx}`), role, content: content.trim() } as ChatMessage;
    });
    setChats((prev) => {
      const chat = prev[selectedChatId];
      if (!chat) return prev;
      const updated: Chat = { ...chat, messages: converted, updatedAt: Date.now() };
      return { ...prev, [selectedChatId]: updated };
    });
  }, [uiMessages, selectedChatId]);

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
            <h3 className="text-xl font-semibold text-cyan-400 mb-3">
              Remote MCP Tools
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  placeholder="mcp remote url"
                  className="w-full sm:flex-1 min-w-0 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium"
                >
                  connect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Chat section */}
      <div className="mt-6 -mx-8 px-8 xl:-mx-12 xl:px-12 2xl:-mx-16 2xl:px-16">
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
                {Object.values(chats)
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((c) => {
                    const isSelected = selectedChatId === c.id;
                    const isEditing = editingChatId === c.id;
                    return (
                      <div
                        key={c.id}
                        className={`group flex items-center gap-2 rounded ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                      >
                        {isEditing ? (
                          <input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={handleRenameKeyDown}
                            autoFocus
                            className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Rename chat"
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedChatId(c.id)}
                              onDoubleClick={() => startRenameChat(c.id)}
                              className="flex-1 text-left px-3 py-2 rounded text-sm"
                            >
                              {c.title}
                            </button>
                            <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startRenameChat(c.id)}
                                className="px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-700 text-xs"
                                aria-label={`Rename ${c.title}`}
                                title="Rename"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteChat(c.id)}
                                className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs"
                                aria-label={`Delete ${c.title}`}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                <button
                  type="button"
                  onClick={createAndSelectNewChat}
                  className="w-full text-left px-3 py-2 rounded text-sm transition-colors bg-slate-700 hover:bg-slate-600 text-white"
                >
                  New chat
                </button>
              </div>
            </aside>
            <section className="flex-1 min-w-0 min-h-[320px] flex flex-col">
              <div className="flex-1 min-w-0 overflow-auto border border-slate-700 rounded-md p-3 bg-slate-900/40 space-y-3">
                {(chats[selectedChatId]?.messages?.length ?? 0) === 0 && (
                  <p className="text-sm text-slate-400">Start the conversation below…</p>
                )}
                {(chats[selectedChatId]?.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] px-3 py-2 rounded-md text-sm ${m.role === 'user' ? 'ml-auto bg-cyan-600 text-white' : 'mr-auto bg-slate-700 text-slate-100'}`}
                  >
                    {m.content}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="mt-3 flex gap-2 min-w-0">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-48 shrink-0 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  aria-label="Select model"
                  title="Select AI model"
                >
                  
                  <option value="stealth/sonoma-sky-alpha">Stealth Sonoma Sky (alpha)</option>
                  <option value="stealth/sonoma-dusk-alpha">Stealth Sonoma Dusk (alpha)</option>
                </select>
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
  );
}
