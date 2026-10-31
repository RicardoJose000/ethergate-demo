import type { ChainInfo } from './chains'

export type Rarity = 'Legendary' | 'Epic' | 'Rare' | 'Common'

export type GameItem = {
  id: string
  name: string
  image: string
  rarity: Rarity
  type: string
  power: number
  lore: string
  collection: string
  tokenId: string
  contract?: string
  source: 'chain' | 'starter'
}

const art = (file: string) => `${import.meta.env.BASE_URL}items/${file}.webp`

// Starter set shown when a wallet holds no NFTs yet.
// Art rendered in three.js for this demo.
export const STARTER_ITEMS: GameItem[] = [
  { id: 's-1', name: 'Aegis Core', image: art('aegis-core'), rarity: 'Legendary', type: 'Artifact', power: 94,
    lore: 'A glass heart that keeps the gate open. Whoever holds it spawns first.', collection: 'Ethergate Genesis', tokenId: '1', source: 'starter' },
  { id: 's-2', name: 'Warden Key', image: art('warden-key'), rarity: 'Epic', type: 'Key', power: 81,
    lore: 'Opens the vault rooms on floor three. Single use, unless you are lucky.', collection: 'Ethergate Genesis', tokenId: '2', source: 'starter' },
  { id: 's-3', name: 'Rift Blade', image: art('rift-blade'), rarity: 'Epic', type: 'Weapon', power: 88,
    lore: 'Cuts through shields made before the last patch.', collection: 'Ethergate Genesis', tokenId: '3', source: 'starter' },
  { id: 's-4', name: 'Sentinel Shield', image: art('sentinel-shield'), rarity: 'Rare', type: 'Armor', power: 72,
    lore: 'Six sides, six chances to block. The seventh hit is on you.', collection: 'Ethergate Genesis', tokenId: '4', source: 'starter' },
  { id: 's-5', name: 'Helix Relic', image: art('helix-relic'), rarity: 'Rare', type: 'Relic', power: 67,
    lore: 'Loops your last move back once per match.', collection: 'Ethergate Genesis', tokenId: '5', source: 'starter' },
  { id: 's-6', name: 'Nova Orb', image: art('nova-orb'), rarity: 'Legendary', type: 'Artifact', power: 97,
    lore: 'Stores a full charge between matches. Handle with care.', collection: 'Ethergate Genesis', tokenId: '6', source: 'starter' },
  { id: 's-7', name: 'Signal Crown', image: art('signal-crown'), rarity: 'Epic', type: 'Cosmetic', power: 60,
    lore: 'Worn by the top player of each season. Shows up on the leaderboard.', collection: 'Ethergate Genesis', tokenId: '7', source: 'starter' },
  { id: 's-8', name: 'Prism Shard', image: art('prism-shard'), rarity: 'Common', type: 'Material', power: 35,
    lore: 'Crafting material. Three shards make one upgrade.', collection: 'Ethergate Genesis', tokenId: '8', source: 'starter' },
]

// ---- On-chain NFTs (Blockscout public API, no key needed) ----

type BlockscoutNft = {
  id: string
  image_url: string | null
  metadata: { name?: string; image?: string; description?: string } | null
  token: { address_hash?: string; address?: string; name: string | null; type: string }
}

const ipfs = (url?: string | null) =>
  !url ? '' : url.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${url.slice(7).replace(/^ipfs\//, '')}` : url

export async function fetchWalletNfts(address: string, chain: ChainInfo, signal?: AbortSignal): Promise<GameItem[]> {
  const res = await fetch(`${chain.blockscout}/api/v2/addresses/${address}/nft?type=ERC-721,ERC-1155`, { signal })
  if (res.status === 404) return []
  if (!res.ok) throw Object.assign(new Error(`NFT API ${res.status}`), { code: 'NETWORK_ERROR' })
  const data = (await res.json()) as { items?: BlockscoutNft[] }
  return (data.items ?? []).slice(0, 24).map((n, i) => {
    const contract = n.token.address_hash ?? n.token.address ?? ''
    const collection = n.token.name ?? 'Unknown collection'
    return {
      id: `c-${contract}-${n.id}`,
      name: n.metadata?.name ?? `${collection} #${n.id}`,
      image: ipfs(n.image_url ?? n.metadata?.image),
      rarity: 'Common',
      type: n.token.type,
      power: 40 + ((i * 17) % 50),
      lore: n.metadata?.description?.slice(0, 160) || 'Read live from your wallet.',
      collection,
      tokenId: n.id,
      contract,
      source: 'chain',
    }
  })
}
