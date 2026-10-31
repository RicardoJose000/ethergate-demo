import { useCallback, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { WalletProvider } from './state/WalletContext'
import { Nav, ConnectModal, Toasts, Curtain } from './components/chrome'
import { Cursor } from './components/fx'
import Landing from './pages/Landing'
import Lobby from './pages/Lobby'

// Hash routing keeps GitHub Pages happy: #/ and #/lobby
const readRoute = () => (location.hash.replace(/^#\/?/, '').startsWith('lobby') ? 'lobby' : '')

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [phase, setPhase] = useState<'cover' | 'reveal'>('reveal')
  const lenis = useRef<Lenis | null>(null)

  // Smooth scrolling
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const l = new Lenis({ duration: 1.15, smoothWheel: true })
    lenis.current = l
    let raf = 0
    const loop = (t: number) => { l.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); l.destroy() }
  }, [])

  // Curtain closes, page swaps behind it, curtain opens.
  const go = useCallback((r: string) => {
    if (r === readRoute()) { lenis.current?.scrollTo(0); window.scrollTo(0, 0); return }
    setPhase('cover')
    setTimeout(() => {
      history.pushState(null, '', r ? `#/${r}` : '#/')
      setRoute(r)
      lenis.current?.scrollTo(0, { immediate: true })
      window.scrollTo(0, 0)
      setPhase('reveal')
    }, 850)
  }, [])

  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <WalletProvider>
      <Nav route={route} go={go} />
      {route === 'lobby' ? <Lobby go={go} /> : <Landing go={go} />}
      <ConnectModal onConnected={() => route !== 'lobby' && go('lobby')} />
      <Toasts />
      <Curtain phase={phase} />
      <Cursor />
      <div className="grain" aria-hidden="true" />
    </WalletProvider>
  )
}
