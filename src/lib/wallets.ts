// Wallet connectors. Every wallet ends up as a plain EIP-1193 provider,
// so the rest of the app only deals with one kind of object.

import { TARGET_CHAIN, MAINNET } from './chains'

export type Eip1193 = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>
  on?(event: string, fn: (...args: any[]) => void): void
  removeListener?(event: string, fn: (...args: any[]) => void): void
  disconnect?(): Promise<void>
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
}

export type WalletKind = 'metamask' | 'walletconnect' | 'coinbase' | 'demo'

type Announced = { info: { uuid: string; name: string; icon: string; rdns: string }; provider: Eip1193 }

declare global {
  interface Window {
    ethereum?: Eip1193 & { providers?: Eip1193[] }
  }
}

export const WC_PROJECT_ID = (import.meta.env.VITE_WC_PROJECT_ID as string | undefined) || ''

export const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export const metamaskDeepLink = () =>
  `https://metamask.app.link/dapp/${location.host}${location.pathname}${location.hash}`

export class WalletNotFoundError extends Error {
  kind: WalletKind
  constructor(kind: WalletKind) {
    super(`${kind} not found`)
    this.kind = kind
  }
}

// ---- EIP-6963: let every installed wallet extension announce itself ----

const announced = new Map<string, Announced>()
const listeners = new Set<() => void>()

export function startDiscovery() {
  if (typeof window === 'undefined') return
  window.addEventListener('eip6963:announceProvider', (ev: Event) => {
    const detail = (ev as CustomEvent<Announced>).detail
    if (!detail?.info?.rdns) return
    announced.set(detail.info.rdns, detail)
    listeners.forEach((fn) => fn())
  })
  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

export function onDiscovery(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function legacyInjected(test: (p: Eip1193) => boolean): Eip1193 | null {
  const eth = window.ethereum
  if (!eth) return null
  if (eth.providers?.length) return eth.providers.find(test) ?? null
  return test(eth) ? eth : null
}

export function findMetaMask(): Eip1193 | null {
  return announced.get('io.metamask')?.provider ?? legacyInjected((p) => !!p.isMetaMask && !p.isCoinbaseWallet)
}

export function findCoinbaseExtension(): Eip1193 | null {
  return announced.get('com.coinbase.wallet')?.provider ?? legacyInjected((p) => !!p.isCoinbaseWallet)
}

export const detected = () => ({
  metamask: !!findMetaMask(),
  coinbase: !!findCoinbaseExtension(),
  walletconnect: !!WC_PROJECT_ID,
})

// ---- Connectors ----

let wcProvider: Eip1193 | null = null

export async function getProvider(kind: Exclude<WalletKind, 'demo'>): Promise<Eip1193> {
  if (kind === 'metamask') {
    const p = findMetaMask()
    if (!p) throw new WalletNotFoundError('metamask')
    return p
  }

  if (kind === 'coinbase') {
    const ext = findCoinbaseExtension()
    if (ext) return ext
    // No extension: Coinbase SDK opens Smart Wallet in a popup, or the mobile app via QR.
    const { createCoinbaseWalletSDK } = await import('@coinbase/wallet-sdk')
    const sdk = createCoinbaseWalletSDK({
      appName: 'Ethergate',
      appLogoUrl: `${location.origin}${import.meta.env.BASE_URL}favicon.svg`,
      appChainIds: [TARGET_CHAIN.id, MAINNET.id],
      preference: { options: 'all' },
    })
    return sdk.getProvider() as unknown as Eip1193
  }

  // WalletConnect: QR on desktop, deep link on mobile.
  if (!WC_PROJECT_ID) throw new Error('WalletConnect project id missing')
  if (wcProvider) return wcProvider
  const { EthereumProvider } = await import('@walletconnect/ethereum-provider')
  const p = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [TARGET_CHAIN.id],
    optionalChains: [MAINNET.id],
    showQrModal: true,
    rpcMap: { [TARGET_CHAIN.id]: TARGET_CHAIN.rpc, [MAINNET.id]: MAINNET.rpc },
    metadata: {
      name: 'Ethergate',
      description: 'Wallet connection and game lobby demo',
      url: location.origin,
      icons: [`${location.origin}${import.meta.env.BASE_URL}favicon.svg`],
    },
  })
  await p.enable()
  wcProvider = p as unknown as Eip1193
  return wcProvider
}

export function forgetWalletConnect() {
  wcProvider = null
}
