import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { rainbowWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets'

// WalletConnect Cloud project ID (public, used by wallet UIs)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'

// Only allow Rainbow wallet in the RainbowKit modal/connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [rainbowWallet, coinbaseWallet],
    },
  ],
  {
    appName: 'AI Spend Debug',
    projectId,
  },
)

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

export type AppWagmiConfig = typeof config
