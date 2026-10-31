import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, useVelocity, useReducedMotion } from 'motion/react'
import { useWallet } from '../state/WalletContext'
import { STARTER_ITEMS } from '../lib/items'
import type { WalletKind } from '../lib/wallets'
import { Kinetic, Reveal, Tilt, VideoBg, Magnetic, media } from '../components/fx'
import { ChainTicker, CTAButton } from '../components/chrome'
import { MetaMaskLogo, WalletConnectLogo, CoinbaseLogo, Arrow, Shield, Pen, Eye } from '../components/icons'

const Hero3D = lazy(() => import('../components/Hero3D'))

export default function Landing({ go }: { go: (r: string) => void }) {
  const w = useWallet()
  const enter = () => (w.status === 'connected' ? go('lobby') : w.openModal())
  const demo = async () => { if (await w.connect('demo')) go('lobby') }

  return (
    <main>
      <Hero onConnect={enter} onDemo={demo} />
      <Marquee />
      <Wallets go={go} />
      <FilmReel />
      <Flow />
      <Items />
      <Security />
      <FinalCTA onEnter={() => go('lobby')} />
      <footer className="footer">
        <div className="wrap">
          <span>Ethergate · Phase 1 demo build · Runs on {`Sepolia testnet`}</span>
          <span>Footage: Mixkit · Item art rendered in three.js · React, TypeScript, ethers.js v6</span>
        </div>
      </footer>
    </main>
  )
}

// ---------------- hero ----------------
function Hero({ onConnect, onDemo }: { onConnect: () => void; onDemo: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.18])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  return (
    <section className="hero" ref={ref}>
      <motion.div style={{ position: 'absolute', inset: 0, zIndex: -2, y, scale }}>
        <VideoBg src="hero.mp4" poster="hero.jpg" />
      </motion.div>
      <Suspense fallback={null}><Hero3D /></Suspense>
      <motion.div className="wrap hero-content" style={{ opacity: fade }}>
        <motion.span className="eyebrow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.8 }}>
          Phase 1 demo · Ethereum Sepolia
        </motion.span>
        <Kinetic as="h1" inView={false} delay={1.05} lines={['Connect.', 'Enter.', { text: 'Play.', cls: 'grad' }]} />
        <div className="hero-row">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}>
            <p className="lead">MetaMask, WalletConnect or Coinbase Wallet. The right network, a gas-free sign in, and players land in the lobby with their items.</p>
            <div className="hero-actions">
              <CTAButton onClick={onConnect} />
              <Magnetic><button className="btn" onClick={onDemo}>Try demo mode</button></Magnetic>
            </div>
          </motion.div>
          <motion.div className="hero-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}>
            <ChainTicker />
            <span className="scroll-cue"><i />Scroll</span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

function Marquee() {
  const words = [['MetaMask', 'Wallet'], ['WalletConnect', 'QR'], ['Coinbase', 'Wallet'], ['ethers.js', 'v6'], ['Sign-In', 'with Ethereum'], ['NFT', 'inventory'], ['Typed', 'signatures'], ['Sepolia', 'testnet']]
  const row = words.map(([a, b], i) => <span className="marquee-item" key={i}><span><b>{a}</b> {b}</span></span>)
  return <div className="marquee" aria-hidden="true"><div className="marquee-track">{row}{row}</div></div>
}

// ---------------- wallets ----------------
function Wallets({ go }: { go: (r: string) => void }) {
  const w = useWallet()
  const cards: { kind: WalletKind; name: string; Logo: () => React.ReactElement; text: string; on: boolean; onText: string; offText: string; halo: string }[] = [
    { kind: 'metamask', name: 'MetaMask', Logo: MetaMaskLogo, halo: '#f6851b', on: w.installed.metamask,
      text: 'Detected the moment the page loads. On phones we open the MetaMask app browser for you.', onText: 'Detected in this browser', offText: 'Install link or app deep link' },
    { kind: 'walletconnect', name: 'WalletConnect', Logo: WalletConnectLogo, halo: '#3b99fc', on: w.installed.walletconnect,
      text: 'Any mobile wallet. Scan a QR on desktop, tap to open on mobile. Session survives a refresh.', onText: 'QR pairing ready', offText: 'Enabled with a project ID' },
    { kind: 'coinbase', name: 'Coinbase Wallet', Logo: CoinbaseLogo, halo: '#0052ff', on: true,
      text: 'Extension if you have it, Smart Wallet popup if you do not. No seed phrase needed to start.', onText: w.installed.coinbase ? 'Detected in this browser' : 'Smart Wallet popup', offText: '' },
  ]
  const pick = async (k: WalletKind) => {
    if ((k === 'metamask' && !w.installed.metamask) || (k === 'walletconnect' && !w.installed.walletconnect)) { w.openModal(); return }
    if (await w.connect(k)) go('lobby')
  }
  return (
    <section className="section" id="wallets">
      <div className="wrap">
        <div className="split-head">
          <div>
            <Reveal><span className="eyebrow">01 / Wallets</span></Reveal>
            <Kinetic className="h2" lines={['Three wallets.', { text: 'One door.', cls: 'grad' }]} />
          </div>
          <Reveal delay={0.15}><p className="lead">Same flow for every player. The app talks to one wallet object, so a new wallet plugs in later without touching game code.</p></Reveal>
        </div>
        <div className="wallet-grid">
          {cards.map((c, i) => (
            <Reveal key={c.kind} delay={i * 0.12} y={60}>
              <Tilt as="button" className="wallet-card glass" onClick={() => pick(c.kind)} label={`Connect with ${c.name}`}>
                <span className="halo" style={{ background: c.halo }} />
                <span className="num">0{i + 1}</span>
                <span className="logo"><c.Logo /></span>
                <span>
                  <h3>{c.name}</h3>
                  <p>{c.text}</p>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
                    <span className={`status ${c.on ? 'on' : ''}`}><span className="dot" />{c.on ? c.onText : c.offText}</span>
                    <span style={{ color: 'var(--teal)' }}><Arrow /></span>
                  </span>
                </span>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- film reel (scroll-driven) ----------------
const CLIPS = [
  { src: 'reel-1', label: 'SCENE 01', title: 'Gear up' },
  { src: 'reel-2', label: 'SCENE 02', title: 'Enter match' },
  { src: 'reel-3', label: 'SCENE 03', title: 'Squad online' },
  { src: 'reel-4', label: 'SCENE 04', title: 'Clutch moment' },
  { src: 'reel-5', label: 'SCENE 05', title: 'Loot drop' },
]

function ReelClip({ src, label, title, i }: { src: string; label: string; title: string; i: number }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [tc, setTc] = useState('00:00:00')
  useEffect(() => {
    const v = ref.current!
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 })
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return (
    <div className="film">
      <div className="film-frame">
        <span className="film-label"><span className="rec" />{label} · {title.toUpperCase()}</span>
        <video ref={ref} src={media(`${src}.mp4`)} poster={media(`${src}.jpg`)} muted loop playsInline preload="none"
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime
            setTc(`0${i + 1}:${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 24)).padStart(2, '0')}`)
          }} />
        <span className="film-meta"><span>ETHERGATE / REEL A</span><span>{tc}</span></span>
      </div>
    </div>
  )
}

function FilmReel() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const reduce = useReducedMotion()
  useLayoutEffect(() => {
    const measure = () => setDist(Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth + 40))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const { scrollY } = useScroll()
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])
  const vel = useVelocity(scrollY)
  const skew = useSpring(useTransform(vel, [-3000, 0, 3000], [6, 0, -6]), { stiffness: 200, damping: 30 })
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const titleX = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  return (
    <section className="reel-section" ref={section} id="players">
      <div className="reel-sticky">
        <VideoBg src="lobby.mp4" poster="lobby.jpg" className="reel-bg" />
        <div className="reel-head wrap">
          <span className="eyebrow">02 / Players</span>
          <motion.h2 className="display h2" style={{ x: titleX, whiteSpace: 'nowrap', marginTop: 14 }}>
            Built for players, <span className="outline-text">not paperwork.</span>
          </motion.h2>
        </div>
        <motion.div className="reel-track" ref={track} style={{ x: reduce ? 0 : x, skewX: reduce ? 0 : skew }}>
          {CLIPS.map((c, i) => <ReelClip key={c.src} {...c} i={i} />)}
        </motion.div>
        <div className="reel-caption wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <span className="muted">No forms. No passwords. The wallet is the login.</span>
            <span className="mono muted" style={{ fontSize: 12 }}>REEL A · 5 SCENES</span>
          </div>
          <div className="reel-progress"><motion.i style={{ width: bar }} /></div>
        </div>
      </div>
    </section>
  )
}

// ---------------- flow ----------------
const STEPS = [
  { k: 'STEP 01', t: 'Connect', p: 'Player picks MetaMask, WalletConnect or Coinbase Wallet. No extension? They get an install link or the app, not an error.', chips: [['MetaMask', ''], ['WalletConnect', ''], ['Coinbase Wallet', '']] },
  { k: 'STEP 02', t: 'Network check', p: 'Wrong chain, we ask to switch. Chain missing from the wallet, we add it for them. One tap either way.', chips: [['Wrong network → switch', 'warn'], ['Missing chain → add', 'warn']] },
  { k: 'STEP 03', t: 'Sign in', p: 'One short message, signed in the wallet. No gas, nothing moves. It proves the player owns the address.', chips: [['No gas', 'ok'], ['EIP-4361', ''], ['Verified in app', 'ok']] },
  { k: 'STEP 04', t: 'Lobby', p: 'Address, balance and NFT items load straight from the chain. Empty wallet? A starter set keeps the screen alive.', chips: [['ETH balance', ''], ['NFT items', ''], ['Starter set', '']] },
  { k: 'STEP 05', t: 'Play', p: 'Game calls run from the lobby. Each one shows pending, confirmed or failed, with a link to the explorer.', chips: [['Pending', 'warn'], ['Confirmed', 'ok'], ['Failed', 'err']] },
]

function Flow() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return (
    <section className="section band" id="flow" style={{ borderBlock: 0 }}>
      <VideoBg src="network.mp4" poster="network.jpg" className="flow-bg" />
      <div className="wrap flow">
        <div className="flow-sticky">
          <Reveal><span className="eyebrow">03 / How it works</span></Reveal>
          <Kinetic className="h2 flow-title" lines={['From click', 'to gameplay', { text: 'in 5 steps.', cls: 'grad' }]} />
          <Reveal delay={0.2}><p className="lead" style={{ marginTop: 24 }}>Every step has its own clear state. Nothing fails silently, and no raw error code ever reaches a player.</p></Reveal>
        </div>
        <div className="flow-steps" ref={ref}>
          <div className="flow-line"><motion.i style={{ scaleY: line }} /></div>
          {STEPS.map((s, i) => (
            <Reveal key={s.k} className="flow-step" delay={0.05 * i}>
              <span className="node" />
              <span className="k">{s.k}</span>
              <h3>{s.t}</h3>
              <p>{s.p}</p>
              <div className="chip-row">{s.chips.map(([c, tone]) => <span key={c} className={`chip ${tone}`}>{c}</span>)}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- items ----------------
function Items() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const a = useTransform(scrollYProgress, [0, 1], ['4%', '-30%'])
  const b = useTransform(scrollYProgress, [0, 1], ['-30%', '4%'])
  const rowA = STARTER_ITEMS.slice(0, 4).concat(STARTER_ITEMS.slice(4))
  const rowB = STARTER_ITEMS.slice(4).concat(STARTER_ITEMS.slice(0, 4))
  const card = (it: typeof STARTER_ITEMS[number], k: string) => (
    <Tilt key={k} className="item-card" max={8}>
      <div className="art"><img src={it.image} alt={it.name} loading="lazy" /></div>
      <div className="info">
        <div className="row"><span className={`rarity r-${it.rarity}`}>{it.rarity}</span><span>PWR {it.power}</span></div>
        <h4>{it.name}</h4>
        <div className="row" style={{ marginTop: 4 }}><span>{it.type}</span><span>#{it.tokenId.padStart(4, '0')}</span></div>
      </div>
    </Tilt>
  )
  return (
    <section className="section items-section" id="items" ref={ref}>
      <div className="wrap split-head">
        <div>
          <Reveal><span className="eyebrow">04 / Items</span></Reveal>
          <Kinetic className="h2" lines={['Your items,', { text: 'read from the chain.', cls: 'grad' }]} />
        </div>
        <Reveal delay={0.15}><p className="lead">The lobby pulls NFTs straight from the player's wallet. New players get a starter set, so the screen is never empty.</p></Reveal>
      </div>
      <motion.div className="items-row" style={{ x: a }}>{rowA.map((it, i) => card(it, `a${i}`))}</motion.div>
      <motion.div className="items-row" style={{ x: b, marginTop: 22 }}>{rowB.map((it, i) => card(it, `b${i}`))}</motion.div>
    </section>
  )
}

// ---------------- security ----------------
function Security() {
  const points = [
    { Icon: Shield, t: 'No private keys', p: 'Ethergate never asks for a seed phrase or a key. Not now, not later.' },
    { Icon: Pen, t: 'Gas-free sign in', p: 'Signing a message proves ownership. It costs nothing and moves nothing.' },
    { Icon: Eye, t: 'Nothing hidden', p: 'Every transaction shows up in the wallet first. Players see it, then approve it.' },
  ]
  return (
    <section className="section band" id="security">
      <VideoBg src="secure.mp4" poster="secure.jpg" />
      <div className="wrap">
        <Reveal><span className="eyebrow">05 / Security</span></Reveal>
        <Kinetic className="h2" lines={['Your keys never', { text: 'leave your wallet.', cls: 'grad' }]} />
        <div className="sec-grid">
          {points.map(({ Icon, t, p }, i) => (
            <Reveal key={t} delay={i * 0.1}>
              <div className="sec-card glass"><div className="ic"><Icon /></div><h4>{t}</h4><p>{p}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------- final CTA ----------------
function FinalCTA({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="cta">
      <VideoBg src="arena.mp4" poster="arena.jpg" rate={0.8} />
      <div className="wrap">
        <Reveal><span className="eyebrow">Ready</span></Reveal>
        <Kinetic className="" lines={['Enter the', { text: 'arena.', cls: 'grad' }]} />
        <Reveal delay={0.2}><p className="lead">Connect a wallet or jump in with demo mode. Every step in the lobby works.</p></Reveal>
        <Reveal delay={0.3}><CTAButton label="Open the lobby" onClick={onEnter} /></Reveal>
      </div>
    </section>
  )
}
