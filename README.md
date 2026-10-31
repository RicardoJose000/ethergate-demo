# Ethergate

Phase 1 demo of the front-end and wallet layer for an Ethereum game.
Players connect a wallet, land on the right network, sign in without gas, and enter a lobby that reads their NFT items and runs test game calls.

**Live demo:** https://ricardojose000.github.io/ethergate-demo/

## What works

| Requirement | Where |
|---|---|
| MetaMask, WalletConnect, Coinbase Wallet | `src/lib/wallets.ts` |
| One state for account, network, balance, session | `src/state/WalletContext.tsx` |
| Network switch, adds Sepolia if the wallet is missing it | `switchNetwork()` in `WalletContext.tsx` |
| Sign-In with Ethereum (EIP-4361), verified in the app | `signIn()` in `WalletContext.tsx` |
| Plain-English error messages, no raw codes | `src/lib/errors.ts` |
| NFT items from the player's wallet (Blockscout API, no key) | `src/lib/items.ts` |
| Lobby: read call, EIP-712 signed "equip", test transaction with pending / confirmed / failed | `src/pages/Lobby.tsx` |
| Demo mode with a fresh in-browser key (real signatures, simulated transactions) | `connect('demo')` |

Wallets are discovered with EIP-6963, so several installed extensions never fight over `window.ethereum`.
Every wallet ends up as one EIP-1193 provider wrapped by ethers.js v6, so game code never cares which wallet the player used.

## Run it locally

Needs Node 20 or newer.

```bash
npm install
cp .env.example .env.local   # add your WalletConnect project ID
npm run dev
```

Open http://localhost:5173/ethergate-demo/

## Config

| Variable | What it is |
|---|---|
| `VITE_WC_PROJECT_ID` | Free project ID from https://dashboard.reown.com. Without it the WalletConnect option stays disabled; MetaMask, Coinbase and demo mode still work. |

The target chain is one line in `src/lib/chains.ts` (`TARGET_CHAIN`). Sepolia for testing, mainnet when ready.

## Project layout

```
src/
  lib/          chains, wallet connectors, errors, NFT loading
  state/        WalletContext: the only place that talks to providers
  components/   nav, wallet picker, toasts, 3D hero, motion helpers
  pages/        Landing and Lobby
public/
  media/        background video (Mixkit free license)
  items/        item art rendered in three.js
```

## Build and deploy

```bash
npm run build      # outputs to dist/
```

`dist/` is a static site. It is deployed to GitHub Pages here, and works on Vercel, Netlify or any static host.
If you host it at a different path, change `base` in `vite.config.ts`.

## Stack

React 19, TypeScript, Vite, ethers.js v6, Coinbase Wallet SDK, WalletConnect Ethereum Provider, three.js with React Three Fiber, Motion, Lenis.
