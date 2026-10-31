// App chrome: nav, wallet picker, toasts, avatar, live block ticker.

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { JsonRpcProvider } from 'ethers'
import { useWallet, short, walletName } from '../state/WalletContext'
import { TARGET_CHAIN, chainLabel, fmtGwei } from '../lib/chains'
import { isMobile, metamaskDeepLink, type WalletKind } from '../lib/wallets'
import { BrandMark, MetaMaskLogo, WalletConnectLogo, CoinbaseLogo, DemoLogo, Close, Arrow, Shield } from './icons'
import { Magnetic } from './fx'

// ---- deterministic gradient avatar from an address ----
export function Avatar({ address, size = 28 }: { address: string; size?: number }) {
  const bg = useMemo(() => {
    const h = (n: number) => parseInt(address.slice(2 + n * 6, 8 + n * 6), 16) % 360
    const [a, b, c] = [h(0), h(1), h(2)]
    return `conic-gradient(from ${a}deg, hsl(${a} 80% 60%), hsl(${b} 85% 45%), hsl(${c} 75% 55%), hsl(${a} 80% 60%))`
  }, [address])
  return <span className="avatar" style={{ width: size, height: size, background: bg }} aria-hidden="true" />
}

// ---- top navigation ----
export function Nav({ route, go }: { route: string; go: (r: string) => void }) {
  const w = useWallet()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(v > 40)
    setHidden(v > 400 && v > prev + 2)
  })
  const onLanding = route !== 'lobby'
  const link = (hash: string, label: string) => (
    <a href={`#${hash}`} onClick={(e) => { e.preventDefault(); if (!onLanding) go(''); setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), onLanding ? 0 : 900) }}>{label}</a>
  )
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''} ${hidden ? 'hidden' : ''}`}>
      <div className="wrap nav-inner">
        <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); go('') }} aria-label="Ethergate home">
          <BrandMark /> ETHERGATE
        </a>
        <nav className="nav-links" aria-label="Main">
          {link('wallets', 'Wallets')}
          {link('flow', 'How it works')}
          {link('items', 'Items')}
          <a href="#/lobby" className={route === 'lobby' ? 'active' : ''} onClick={(e) => { e.preventDefault(); go('lobby') }}>Lobby</a>
        </nav>
        <div className="nav-right">
          <span className={`pill ${w.status !== 'connected' ? 'off' : w.wrongNetwork ? 'warn' : ''}`}>
            <span className="dot" />{w.status === 'connected' ? chainLabel(w.chainId) : TARGET_CHAIN.short}
          </span>
          {w.status === 'connected' && w.address ? (
            <button className="acct" onClick={() => go('lobby')} title="Open lobby">
              <Avatar address={w.address} /><span>{short(w.address)}</span>
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={w.openModal} disabled={w.status === 'connecting'}>
              {w.status === 'connecting' ? 'Connecting...' : 'Connect wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// ---- wallet picker ----
const OPTIONS: { kind: WalletKind; Logo: () => React.ReactElement; sub: string }[] = [
  { kind: 'metamask', Logo: MetaMaskLogo, sub: 'Browser extension or MetaMask mobile' },
  { kind: 'walletconnect', Logo: WalletConnectLogo, sub: 'Scan a QR code with any mobile wallet' },
  { kind: 'coinbase', Logo: CoinbaseLogo, sub: 'Extension, Smart Wallet or the Coinbase app' },
  { kind: 'demo', Logo: DemoLogo, sub: 'No wallet? Walk through every step' },
]

export function ConnectModal({ onConnected }: { onConnected: () => void }) {
  const w = useWallet()
  const [pending, setPending] = useState<WalletKind | null>(null)

  useEffect(() => {
    if (!w.modalOpen) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && w.closeModal()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [w.modalOpen, w.closeModal])

  const tag = (k: WalletKind) => {
    if (k === 'demo') return { text: 'No install', on: true }
    if (k === 'walletconnect') return w.installed.walletconnect ? { text: 'QR ready', on: true } : { text: 'Needs project ID', on: false }
    if (k === 'metamask') return w.installed.metamask ? { text: 'Detected', on: true } : { text: isMobile() ? 'Open app' : 'Not installed', on: false }
    return w.installed.coinbase ? { text: 'Detected', on: true } : { text: 'Popup', on: true }
  }

  const pick = async (k: WalletKind) => {
    if (k === 'metamask' && !w.installed.metamask) {
      if (isMobile()) { location.href = metamaskDeepLink(); return }
      window.open('https://metamask.io/download/', '_blank', 'noopener')
      w.toast({ tone: 'info', title: 'MetaMask not found', detail: 'Install the extension, refresh this page, then connect.' })
      return
    }
    if (k === 'walletconnect' && !w.installed.walletconnect) {
      w.toast({ tone: 'info', title: 'WalletConnect needs a project ID', detail: 'It is a free key from Reown. Added at kickoff, then QR pairing works on any phone wallet.' })
      return
    }
    setPending(k)
    if (k === 'walletconnect') w.closeModal() // the QR modal takes over
    const ok = await w.connect(k)
    setPending(null)
    if (ok) { w.closeModal(); onConnected() }
  }

  return (
    <AnimatePresence>
      {w.modalOpen && (
        <motion.div className="overlay" onClick={w.closeModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="modal" role="dialog" aria-modal="true" aria-labelledby="cm-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, scale: 0.96, opacity: 0, rotateX: 12 }} animate={{ y: 0, scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{ transformPerspective: 900 }}
          >
            <div className="modal-head">
              <div>
                <h3 id="cm-title">Connect a wallet</h3>
                <p className="sub">Pick one. You can switch any time.</p>
              </div>
              <button className="icon-btn" onClick={w.closeModal} aria-label="Close"><Close /></button>
            </div>
            {OPTIONS.map(({ kind, Logo, sub }, i) => {
              const t = tag(kind)
              return (
                <motion.button
                  key={kind} className={`wopt ${pending === kind ? 'loading' : ''}`} onClick={() => pick(kind)}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="logo"><Logo /></span>
                  <span><span className="t">{walletName(kind)}</span><br /><span className="s">{sub}</span></span>
                  {pending === kind ? <span className="spinner" style={{ marginLeft: 'auto' }} /> : <span className={`tag ${t.on ? 'on' : ''}`}>{t.text}</span>}
                </motion.button>
              )
            })}
            <div className="modal-foot">
              <span style={{ color: 'var(--teal)' }}><Shield /></span>
              <span>Ethergate never sees your private key. You approve every signature and transaction in your own wallet.</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---- toasts ----
export function Toasts() {
  const { toasts, dismissToast } = useWallet()
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className={`toast ${t.tone}`} onClick={() => dismissToast(t.id)} layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
            <span className="bar" />
            <div><b>{t.title}</b>{t.detail && <span>{t.detail}</span>}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ---- live Sepolia block number from a public RPC ----
const rpc = new JsonRpcProvider(TARGET_CHAIN.rpc, TARGET_CHAIN.id, { staticNetwork: true })

export function ChainTicker() {
  const [block, setBlock] = useState<number | null>(null)
  const [gas, setGas] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const [b, fee] = await Promise.all([rpc.getBlockNumber(), rpc.getFeeData()])
        if (!alive) return
        setBlock((prev) => { if (prev !== b) { setFlash(true); setTimeout(() => setFlash(false), 900) } return b })
        if (fee.gasPrice != null) setGas(fmtGwei(fee.gasPrice))
      } catch { /* keep last value */ }
    }
    tick()
    const id = setInterval(tick, 12000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return (
    <div className="ticker glass">
      <span className="pill" style={{ height: 24, border: 0, padding: 0, background: 'none' }}><span className="dot" />LIVE</span>
      <span>{TARGET_CHAIN.short} block <b className={flash ? 'flash' : ''}>{block ? `#${block.toLocaleString('en-US')}` : '...'}</b></span>
      <span>gas <b>{gas ?? '...'}</b> gwei</span>
    </div>
  )
}

// ---- cinematic curtain between pages ----
export function Curtain({ phase }: { phase: 'cover' | 'reveal' }) {
  const cover = phase === 'cover'
  return (
    <div className="curtain" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.i key={i} initial={{ scaleY: 1 }} animate={{ scaleY: cover ? 1 : 0 }}
          style={{ transformOrigin: cover ? 'bottom' : 'top' }}
          transition={{ duration: 0.8, delay: cover ? i * 0.05 : 0.35 + i * 0.06, ease: [0.76, 0, 0.24, 1] }} />
      ))}
      <motion.div className="mark" initial={{ opacity: 1, letterSpacing: '0.42em' }}
        animate={{ opacity: cover ? 1 : 0, letterSpacing: cover ? '0.3em' : '0.12em' }}
        transition={{ duration: 0.7, delay: cover ? 0.25 : 0, ease: [0.22, 1, 0.36, 1] }}>
        ETHERGATE
      </motion.div>
    </div>
  )
}

export function CTAButton({ label = 'Connect wallet', onClick }: { label?: string; onClick: () => void }) {
  return (
    <Magnetic>
      <button className="btn btn-primary" onClick={onClick}>{label} <Arrow /></button>
    </Magnetic>
  )
}
