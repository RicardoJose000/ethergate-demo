// Game lobby: player, network, sign-in, NFT inventory and test game calls.

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { JsonRpcProvider, hexlify, toUtf8Bytes, verifyTypedData, type Provider } from 'ethers'
import { useWallet, short, walletName } from '../state/WalletContext'
import { TARGET_CHAIN, KNOWN_CHAINS, chainLabel, txUrl, addressUrl, fmtGwei } from '../lib/chains'
import { friendlyError } from '../lib/errors'
import { STARTER_ITEMS, fetchWalletNfts, type GameItem } from '../lib/items'
import { Avatar } from '../components/chrome'
import { Kinetic, Reveal, Tilt, VideoBg, Magnetic } from '../components/fx'
import { Arrow, Close } from '../components/icons'

const publicRpc = new JsonRpcProvider(TARGET_CHAIN.rpc, TARGET_CHAIN.id, { staticNetwork: true })
const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false })

export default function Lobby({ go }: { go: (r: string) => void }) {
  const w = useWallet()
  return (
    <main className="lobby">
      <VideoBg src="lobby.mp4" poster="lobby.jpg" />
      <div className="wrap">
        {w.status === 'connected' && w.address ? <Connected /> : <Gate onBack={() => go('')} />}
      </div>
    </main>
  )
}

function Gate({ onBack }: { onBack: () => void }) {
  const w = useWallet()
  return (
    <section className="gate">
      <div>
        <span className="eyebrow">Lobby · locked</span>
        <Kinetic as="h1" inView={false} delay={0.6} lines={['The gate is', { text: 'waiting.', cls: 'grad' }]} />
        <motion.p className="lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          Connect a wallet to load your player, network and items. No wallet on this device? Demo mode walks through every step.
        </motion.p>
        <motion.div className="hero-actions" style={{ justifyContent: 'center' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }}>
          <Magnetic><button className="btn btn-primary" onClick={w.openModal} disabled={w.status === 'connecting'}>
            {w.status === 'connecting' ? 'Connecting...' : 'Connect wallet'} <Arrow /></button></Magnetic>
          <Magnetic><button className="btn" onClick={() => w.connect('demo')}>Use demo mode</button></Magnetic>
          <button className="btn" onClick={onBack} style={{ border: 0 }}>Back to home</button>
        </motion.div>
      </div>
    </section>
  )
}

function Connected() {
  const w = useWallet()
  const [items, setItems] = useState<GameItem[] | null>(null)
  const [nftError, setNftError] = useState(false)
  const [tab, setTab] = useState<'wallet' | 'starter'>('starter')
  const [open, setOpen] = useState<GameItem | null>(null)
  const [equipped, setEquipped] = useState<string | null>(null)

  // Load NFTs whenever the account or network changes.
  useEffect(() => {
    if (!w.address || w.kind === 'demo') { setItems([]); return }
    const chain = KNOWN_CHAINS[w.chainId ?? 0]
    if (!chain) { setItems([]); return }
    const ctrl = new AbortController()
    setItems(null); setNftError(false)
    fetchWalletNfts(w.address, chain, ctrl.signal)
      .then((list) => {
        setItems(list)
        setTab(list.length ? 'wallet' : 'starter')
        w.addLog({ tone: 'success', title: `Inventory loaded`, detail: list.length ? `${list.length} NFT${list.length > 1 ? 's' : ''} on ${chain.short}` : `No NFTs on ${chain.short} yet, starter set shown` })
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return
        setItems([]); setNftError(true)
        w.addLog({ tone: 'error', title: 'Could not load NFTs', detail: friendlyError(err).detail })
      })
    return () => ctrl.abort()
  }, [w.address, w.chainId, w.kind])

  const list = tab === 'wallet' ? items ?? [] : STARTER_ITEMS
  const equippedItem = [...STARTER_ITEMS, ...(items ?? [])].find((it) => it.id === equipped) ?? null

  return (
    <>
      <div className="lobby-head">
        <div>
          <span className="eyebrow">Lobby · {chainLabel(w.chainId)}</span>
          <Kinetic as="h1" inView={false} delay={0.5} lines={[w.session ? 'Welcome back,' : 'Almost in,', { text: 'player.', cls: 'grad' }]} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {w.kind === 'demo' && <span className="chip warn">Demo mode · transactions simulated</span>}
          <button className="btn btn-sm" onClick={w.disconnect}>Disconnect</button>
        </div>
      </div>

      <div className="lobby-grid">
        <aside className="lobby-side">
          <PlayerPanel />
          <SignInPanel />
        </aside>

        <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
          <Reveal y={30}>
            <section className="panel glass">
              <div className="panel-title">
                <h3>Inventory</h3>
                <div className="tabs" role="tablist">
                  {(['wallet', 'starter'] as const).map((t) => (
                    <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)} style={{ zIndex: 1 }}>
                      {tab === t && <motion.span layoutId="tab-bg" className="tab-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                      {t === 'wallet' ? `In wallet${items ? ` (${items.length})` : ''}` : 'Starter set'}
                    </button>
                  ))}
                </div>
              </div>
              {tab === 'wallet' && items && items.length === 0 && (
                <div className="note">
                  {w.kind === 'demo' ? 'The demo wallet is brand new, so it holds no NFTs. ' : nftError ? 'The NFT service did not answer. ' : `This wallet has no NFTs on ${chainLabel(w.chainId)} yet. `}
                  Switch to the starter set to try equipping an item.
                </div>
              )}
              <div className="inv-grid">
                {tab === 'wallet' && items === null
                  ? Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" />)
                  : list.map((it, i) => (
                    <motion.button key={it.id} className={`inv-card ${equipped === it.id ? 'equipped' : ''}`} onClick={() => setOpen(it)}
                      initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                      {equipped === it.id && <span className="eq">EQUIPPED</span>}
                      <div className="art">{it.image ? <img src={it.image} alt={it.name} loading="lazy" /> : <span className="mono muted">no image</span>}</div>
                      <div className="info">
                        <h4>{it.name}</h4>
                        <div className="row"><span className={`rarity r-${it.rarity}`}>{it.source === 'chain' ? it.type : it.rarity}</span><span>PWR {it.power}</span></div>
                      </div>
                    </motion.button>
                  ))}
              </div>
            </section>
          </Reveal>
          <Reveal y={30} delay={0.1}><GameConsole equipped={equippedItem} /></Reveal>
          <Reveal y={30} delay={0.15}><ActivityLog /></Reveal>
        </div>
      </div>

      <AnimatePresence>
        {open && <ItemDrawer item={open} equipped={equipped === open.id} onClose={() => setOpen(null)} onEquipped={(id) => { setEquipped(id); setOpen(null) }} />}
      </AnimatePresence>
    </>
  )
}

function PlayerPanel() {
  const w = useWallet()
  const [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(w.address!); setCopied(true); setTimeout(() => setCopied(false), 1400) } catch { /* ignore */ } }
  return (
    <Reveal y={30}>
      <section className="panel glass">
        <div className="panel-title"><h3>Player</h3>
          <span className={`pill ${w.wrongNetwork ? 'warn' : ''}`} style={{ height: 28 }}><span className="dot" />{chainLabel(w.chainId)}</span>
        </div>
        <div className="player">
          <Avatar address={w.address!} size={58} />
          <div style={{ minWidth: 0 }}>
            <div className="addr">{short(w.address)}</div>
            <div className="wk">{walletName(w.kind!)} · <button onClick={copy} style={{ background: 'none', border: 0, padding: 0, color: 'var(--teal)', cursor: 'pointer', fontSize: 12.5 }}>{copied ? 'Copied' : 'Copy address'}</button></div>
          </div>
        </div>
        <div className="stats">
          <div className="stat"><div className="l">Balance</div><div className="v">{w.balance ?? '...'} <span className="muted" style={{ fontSize: 12 }}>ETH</span></div></div>
          <div className="stat"><div className="l">Network</div><div className="v">{chainLabel(w.chainId)}</div></div>
        </div>
        {w.wrongNetwork && (
          <motion.div className="warn-box" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <b>Wrong network.</b> The game runs on {TARGET_CHAIN.short}. Switch with one tap. If your wallet does not have it, we add it.
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={w.switchNetwork} disabled={w.busy === 'switch'}>
                {w.busy === 'switch' ? 'Check your wallet...' : `Switch to ${TARGET_CHAIN.short}`}
              </button>
            </div>
          </motion.div>
        )}
        {w.kind !== 'demo' && w.chainId && (
          <a className="mono" style={{ display: 'inline-block', marginTop: 14, fontSize: 12, color: 'var(--muted)' }} href={addressUrl(w.chainId, w.address!)} target="_blank" rel="noreferrer">
            View on explorer ↗
          </a>
        )}
      </section>
    </Reveal>
  )
}

function SignInPanel() {
  const w = useWallet()
  return (
    <Reveal y={30} delay={0.08}>
      <section className="panel glass">
        <div className="panel-title"><h3>Sign in</h3>{w.session ? <span className="chip ok">Verified</span> : <span className="chip">No gas</span>}</div>
        {w.session ? (
          <div className="ok-box">
            <b>Ownership verified.</b> Signed at {fmtTime(w.session.at)}. Your backend can turn this into a session later.
            <div className="sig">{w.session.signature}</div>
          </div>
        ) : (
          <>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 14.5 }}>Sign one short message to prove you own this address. It does not send anything and costs nothing.</p>
            <button className="btn btn-primary btn-sm" onClick={w.signIn} disabled={w.busy === 'signin'}>
              {w.busy === 'signin' ? 'Waiting for signature...' : 'Sign in with Ethereum'}
            </button>
          </>
        )}
      </section>
    </Reveal>
  )
}

type Result = { text: string; href?: string } | null

function GameConsole({ equipped }: { equipped: GameItem | null }) {
  const w = useWallet()
  const [read, setRead] = useState<Result>(null)
  const [tx, setTx] = useState<Result>(null)
  const [busy, setBusy] = useState<'read' | 'tx' | null>(null)

  const readState = useCallback(async () => {
    setBusy('read')
    const id = w.addLog({ tone: 'pending', title: 'Reading game state' })
    try {
      const p: Provider = w.kind === 'demo' ? publicRpc : w.browserProvider()!
      const [block, fee, nonce] = await Promise.all([p.getBlockNumber(), p.getFeeData(), p.getTransactionCount(w.address!)])
      const text = `block #${block.toLocaleString('en-US')} · gas ${fmtGwei(fee.gasPrice)} gwei · nonce ${nonce}`
      setRead({ text })
      w.updateLog(id, { tone: 'success', title: 'Read call OK', detail: text })
    } catch (err) {
      const f = friendlyError(err)
      setRead({ text: f.detail })
      w.updateLog(id, { tone: 'error', title: f.title, detail: f.detail })
    } finally { setBusy(null) }
  }, [w])

  const enterMatch = useCallback(async () => {
    if (w.wrongNetwork) { w.toast({ tone: 'info', title: `Switch to ${TARGET_CHAIN.short} first`, detail: 'Use the button in the Player panel.' }); return }
    setBusy('tx')
    const payload = `ethergate:enter-match:${equipped ? `${equipped.collection}#${equipped.tokenId}` : 'no-item'}`
    const id = w.addLog({ tone: 'pending', title: 'Enter match: confirm in wallet', detail: payload })
    try {
      if (w.kind === 'demo') {
        await new Promise((r) => setTimeout(r, 900))
        const fake = hexlify(crypto.getRandomValues(new Uint8Array(32)))
        w.updateLog(id, { tone: 'pending', title: 'Transaction pending (simulated)', detail: short(fake) })
        setTx({ text: `pending ${short(fake)}` })
        await new Promise((r) => setTimeout(r, 1800))
        w.updateLog(id, { tone: 'success', title: 'Match entered (simulated)', detail: 'Demo mode does not send real transactions.' })
        setTx({ text: `confirmed (simulated) ${short(fake)}` })
        w.toast({ tone: 'success', title: 'Match entered', detail: 'Simulated in demo mode.' })
        return
      }
      const signer = await w.getSigner()
      // 0 ETH to yourself with a small payload: a safe, real transaction for testing the lifecycle.
      const sent = await signer.sendTransaction({ to: w.address!, value: 0n, data: hexlify(toUtf8Bytes(payload)) })
      const href = txUrl(w.chainId!, sent.hash)
      w.updateLog(id, { tone: 'pending', title: 'Transaction pending', detail: short(sent.hash), href })
      setTx({ text: `pending ${short(sent.hash)}`, href })
      const rc = await sent.wait()
      if (!rc || rc.status !== 1) throw Object.assign(new Error('reverted'), { code: 'CALL_EXCEPTION' })
      w.updateLog(id, { tone: 'success', title: 'Match entered', detail: `Confirmed in block #${rc.blockNumber}`, href })
      setTx({ text: `confirmed in block #${rc.blockNumber}`, href })
      w.toast({ tone: 'success', title: 'Match entered', detail: 'Transaction confirmed on chain.' })
      w.refreshBalance()
    } catch (err) {
      const f = friendlyError(err)
      w.updateLog(id, { tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
      setTx({ text: f.detail })
      w.toast({ tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
    } finally { setBusy(null) }
  }, [w, equipped])

  return (
    <section className="panel glass">
      <div className="panel-title"><h3>Game calls</h3><span className="chip">{w.kind === 'demo' ? 'Demo' : TARGET_CHAIN.short}</span></div>
      <div className="actions">
        <div className="action">
          <span className="k">Read · free</span>
          <h4>Read game state</h4>
          <p>Reads block, gas price and your nonce through the connected wallet's provider.</p>
          {read && <div className="result">{read.text}</div>}
          <button className="btn btn-sm" onClick={readState} disabled={busy === 'read'}>{busy === 'read' ? 'Reading...' : 'Run read call'}</button>
        </div>
        <div className="action">
          <span className="k">Sign · free</span>
          <h4>Equip an item</h4>
          <p>Open any item in your inventory and equip it. The wallet signs typed data (EIP-712) the game server can verify.</p>
          <div className="result">{equipped ? `equipped: ${equipped.name} · ${equipped.type}` : 'nothing equipped yet'}</div>
        </div>
        <div className="action">
          <span className="k">Transaction · gas</span>
          <h4>Enter match</h4>
          <p>Sends a 0 ETH test transaction to yourself with the match payload. Tracks pending, confirmed or failed.</p>
          {tx && <div className="result">{tx.text} {tx.href && <a href={tx.href} target="_blank" rel="noreferrer">view ↗</a>}</div>}
          <button className="btn btn-primary btn-sm" onClick={enterMatch} disabled={busy === 'tx'}>{busy === 'tx' ? 'Waiting...' : 'Enter match'}</button>
        </div>
      </div>
    </section>
  )
}

function ActivityLog() {
  const { log } = useWallet()
  return (
    <section className="panel glass">
      <div className="panel-title"><h3>Activity</h3><span className="mono muted" style={{ fontSize: 11 }}>{log.length} events</span></div>
      {log.length === 0 ? <p className="muted" style={{ margin: 0, fontSize: 14 }}>Every connect, switch, signature and transaction shows up here.</p> : (
        <div className="log">
          <AnimatePresence initial={false}>
            {log.map((e) => (
              <motion.div key={e.id} className="log-row" layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
                <time>{fmtTime(e.time)}</time>
                <span className={`d ${e.tone}`} />
                <div><b style={{ fontWeight: 600 }}>{e.title}</b>{e.detail && <small>{e.detail}</small>}{e.href && <a href={e.href} target="_blank" rel="noreferrer">View on Etherscan ↗</a>}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}

function ItemDrawer({ item, equipped, onClose, onEquipped }: { item: GameItem; equipped: boolean; onClose: () => void; onEquipped: (id: string) => void }) {
  const w = useWallet()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const equip = async () => {
    if (w.chainId == null || !w.address) return
    setBusy(true)
    const id = w.addLog({ tone: 'pending', title: `Equip ${item.name}: sign in wallet` })
    try {
      const domain = { name: 'Ethergate', version: '1', chainId: w.chainId }
      const types = { Equip: [{ name: 'player', type: 'address' }, { name: 'item', type: 'string' }, { name: 'slot', type: 'string' }, { name: 'nonce', type: 'uint256' }] }
      const value = { player: w.address, item: `${item.collection} #${item.tokenId}`, slot: item.type, nonce: BigInt(Date.now()) }
      const signer = await w.getSigner()
      const sig = await signer.signTypedData(domain, types, value)
      if (verifyTypedData(domain, types, value, sig).toLowerCase() !== w.address.toLowerCase()) throw new Error('signature mismatch')
      w.updateLog(id, { tone: 'success', title: `${item.name} equipped`, detail: `EIP-712 signature verified · ${short(sig)}` })
      w.toast({ tone: 'success', title: `${item.name} equipped`, detail: 'Signed and verified. No gas used.' })
      onEquipped(item.id)
    } catch (err) {
      const f = friendlyError(err)
      w.updateLog(id, { tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
      w.toast({ tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
    } finally { setBusy(false) }
  }

  return (
    <motion.div className="drawer-wrap" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={item.name}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 220, damping: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className={`rarity r-${item.rarity}`}>{item.source === 'chain' ? item.type : item.rarity}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Close /></button>
        </div>
        <Tilt className="hero-art" max={12}>{item.image ? <img src={item.image} alt={item.name} /> : null}</Tilt>
        <h2>{item.name}</h2>
        <p className="muted" style={{ marginTop: 0 }}>{item.lore}</p>
        <div className="stats" style={{ marginTop: 18 }}>
          <div className="stat"><div className="l">Type</div><div className="v" style={{ fontSize: 16 }}>{item.type}</div></div>
          <div className="stat"><div className="l">Token</div><div className="v" style={{ fontSize: 16 }}>#{item.tokenId}</div></div>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><span className="muted">Power</span><b>{item.power}</b></div>
          <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${item.power}%` }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} /></div>
        </div>
        <p className="mono muted" style={{ fontSize: 11.5, marginTop: 18 }}>
          {item.source === 'chain' ? `${item.collection} · ${short(item.contract)}` : `${item.collection} · starter set`}
        </p>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={equip} disabled={busy || equipped}>
            {equipped ? 'Equipped' : busy ? 'Check your wallet...' : 'Equip · sign'}
          </button>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </motion.aside>
    </motion.div>
  )
}
