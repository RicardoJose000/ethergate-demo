// Networks the app knows about. Sepolia is the target for this phase;
// mainnet is listed so we can show a friendly "wrong network" state.

export type ChainInfo = {
  id: number
  hex: string
  name: string
  short: string
  rpc: string
  explorer: string
  blockscout: string
  currency: { name: string; symbol: string; decimals: number }
  testnet: boolean
}

export const SEPOLIA: ChainInfo = {
  id: 11155111,
  hex: '0xaa36a7',
  name: 'Sepolia Testnet',
  short: 'Sepolia',
  rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
  explorer: 'https://sepolia.etherscan.io',
  blockscout: 'https://eth-sepolia.blockscout.com',
  currency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  testnet: true,
}

export const MAINNET: ChainInfo = {
  id: 1,
  hex: '0x1',
  name: 'Ethereum Mainnet',
  short: 'Mainnet',
  rpc: 'https://ethereum-rpc.publicnode.com',
  explorer: 'https://etherscan.io',
  blockscout: 'https://eth.blockscout.com',
  currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  testnet: false,
}

// The chain the game runs on. Change this one line to go live.
export const TARGET_CHAIN = SEPOLIA

export const KNOWN_CHAINS: Record<number, ChainInfo> = {
  [SEPOLIA.id]: SEPOLIA,
  [MAINNET.id]: MAINNET,
}

export const chainLabel = (id: number | null) =>
  id == null ? 'Not connected' : KNOWN_CHAINS[id]?.short ?? `Chain ${id}`

// Sepolia gas is often far below 1 gwei, so keep enough digits to be honest.
export const fmtGwei = (wei?: bigint | null) => {
  if (wei == null) return '...'
  const g = Number(wei) / 1e9
  return g >= 1 ? g.toFixed(2) : g >= 0.001 ? g.toFixed(3) : '<0.001'
}

export const txUrl = (chainId: number, hash: string) =>
  `${(KNOWN_CHAINS[chainId] ?? TARGET_CHAIN).explorer}/tx/${hash}`

export const addressUrl = (chainId: number, address: string) =>
  `${(KNOWN_CHAINS[chainId] ?? TARGET_CHAIN).explorer}/address/${address}`
