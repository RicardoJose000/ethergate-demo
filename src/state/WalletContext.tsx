// One place that owns the wallet connection.
// Components read state and call actions; they never touch providers directly.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BrowserProvider, Wallet, formatEther, verifyMessage, type Signer, type HDNodeWallet } from 'ethers'
import { TARGET_CHAIN, chainLabel } from '../lib/chains'
import { friendlyError } from '../lib/errors'
import {
  getProvider, startDiscovery, onDiscovery, detected, forgetWalletConnect, findMetaMask, findCoinbaseExtension,
  WalletNotFoundError, type Eip1193, type WalletKind,
} from '../lib/wallets'

export type Status = 'idle' | 'connecting' | 'connected'
export type Tone = 'success' | 'error' | 'info' | 'pending'
export type LogEntry = { id: number; time: Date; tone: Tone; title: string; detail?: string; href?: string }
export type Toast = { id: number; tone: Tone; title: string; detail?: string }
export type Session = { message: string; signature: string; at: Date }

type Ctx = {
  status: Status
  kind: WalletKind | null
  address: string | null
  chainId: number | null
  balance: string | null
  wrongNetwork: boolean
  session: Session | null
  installed: ReturnType<typeof detected>
  busy: string | null
  log: LogEntry[]
  toasts: Toast[]
  modalOpen: boolean
  openModal: () => void
  closeModal: () => void
  connect: (kind: WalletKind) => Promise<boolean>
  disconnect: () => Promise<void>
  switchNetwork: () => Promise<void>
  signIn: () => Promise<void>
  refreshBalance: () => Promise<void>
  getSigner: () => Promise<Signer>
  browserProvider: () => BrowserProvider | null
  addLog: (e: Omit<LogEntry, 'id' | 'time'>) => number
  updateLog: (id: number, e: Partial<LogEntry>) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  setBusy: (b: string | null) => void
}

const WalletCtx = createContext<Ctx | null>(null)
const LAST_KEY = 'ethergate:last-wallet'

const store = {
  get: () => { try { return localStorage.getItem(LAST_KEY) as WalletKind | null } catch { return null } },
  set: (k: WalletKind | null) => { try { k ? localStorage.setItem(LAST_KEY, k) : localStorage.removeItem(LAST_KEY) } catch { /* private mode */ } },
}

let seq = 1

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('idle')
  const [kind, setKind] = useState<WalletKind | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [installed, setInstalled] = useState(detected())
  const [busy, setBusy] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const eip = useRef<Eip1193 | null>(null)
  const demo = useRef<HDNodeWallet | null>(null)
  const unsub = useRef<() => void>(() => {})

  // ---- feedback helpers ----
  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = seq++
    setToasts((x) => [...x.slice(-3), { ...t, id }])
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.tone === 'error' ? 6500 : 4200)
  }, [])
  const dismissToast = useCallback((id: number) => setToasts((x) => x.filter((y) => y.id !== id)), [])
  const addLog = useCallback((e: Omit<LogEntry, 'id' | 'time'>) => {
    const id = seq++
    setLog((x) => [{ ...e, id, time: new Date() }, ...x].slice(0, 40))
    return id
  }, [])
  const updateLog = useCallback((id: number, e: Partial<LogEntry>) => {
    setLog((x) => x.map((y) => (y.id === id ? { ...y, ...e } : y)))
  }, [])
  const fail = useCallback((err: unknown) => {
    const f = friendlyError(err)
    toast({ tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
    addLog({ tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
  }, [toast, addLog])

  // ---- wallet discovery (EIP-6963) ----
  useEffect(() => {
    const off = onDiscovery(() => setInstalled(detected()))
    startDiscovery()
    const t = setTimeout(() => setInstalled(detected()), 600)
    return () => { off(); clearTimeout(t) }
  }, [])

  const browserProvider = useCallback(() => (eip.current ? new BrowserProvider(eip.current, 'any') : null), [])

  const refreshBalance = useCallback(async () => {
    if (demo.current) { setBalance('0.2500'); return }
    const bp = browserProvider()
    if (!bp || !address) return
    try {
      const wei = await bp.getBalance(address)
      setBalance(Number(formatEther(wei)).toFixed(4))
    } catch { setBalance(null) }
  }, [address, browserProvider])

  useEffect(() => { if (status === 'connected') refreshBalance() }, [status, chainId, address, refreshBalance])

  const reset = useCallback(() => {
    unsub.current()
    eip.current = null
    demo.current = null
    setStatus('idle'); setKind(null); setAddress(null); setChainId(null); setBalance(null); setSession(null)
  }, [])

  // ---- provider events: account / network / disconnect ----
  const attach = useCallback((p: Eip1193) => {
    const onAccounts = (accs: string[]) => {
      if (!accs?.length) {
        reset(); store.set(null)
        addLog({ tone: 'info', title: 'Wallet disconnected' })
        toast({ tone: 'info', title: 'Wallet disconnected', detail: 'Connect again whenever you are ready.' })
        return
      }
      setAddress(accs[0]); setSession(null)
      addLog({ tone: 'info', title: 'Account changed', detail: short(accs[0]) })
      toast({ tone: 'info', title: 'Account changed', detail: 'Please sign in again with the new account.' })
    }
    const onChain = (hex: string) => {
      const id = Number(hex)
      setChainId(id)
      addLog({ tone: id === TARGET_CHAIN.id ? 'success' : 'info', title: `Network: ${chainLabel(id)}` })
    }
    const onDisconnect = () => { reset(); store.set(null) }
    p.on?.('accountsChanged', onAccounts)
    p.on?.('chainChanged', onChain)
    p.on?.('disconnect', onDisconnect)
    unsub.current = () => {
      p.removeListener?.('accountsChanged', onAccounts)
      p.removeListener?.('chainChanged', onChain)
      p.removeListener?.('disconnect', onDisconnect)
    }
  }, [reset, addLog, toast])

  const finishConnect = useCallback(async (k: WalletKind, p: Eip1193, accounts: string[]) => {
    const hex = (await p.request({ method: 'eth_chainId' })) as string
    eip.current = p
    attach(p)
    setKind(k); setAddress(accounts[0]); setChainId(Number(hex)); setStatus('connected')
    store.set(k)
  }, [attach])

  // ---- connect ----
  const connect = useCallback(async (k: WalletKind) => {
    unsub.current()
    setStatus('connecting')
    try {
      if (k === 'demo') {
        demo.current = Wallet.createRandom()
        eip.current = null
        setKind('demo'); setAddress(demo.current.address); setChainId(TARGET_CHAIN.id); setStatus('connected')
        addLog({ tone: 'success', title: 'Demo wallet ready', detail: 'A fresh key made in your browser. Signatures are real, transactions are simulated.' })
        toast({ tone: 'success', title: 'Demo mode on', detail: 'No wallet needed. Try every step in the lobby.' })
        return true
      }
      const p = await getProvider(k)
      const accounts = (await p.request({ method: 'eth_requestAccounts' })) as string[]
      if (!accounts?.length) throw Object.assign(new Error('no accounts'), { code: 4001 })
      await finishConnect(k, p, accounts)
      addLog({ tone: 'success', title: `Connected with ${walletName(k)}`, detail: short(accounts[0]) })
      toast({ tone: 'success', title: 'Wallet connected', detail: `${walletName(k)} · ${short(accounts[0])}` })
      return true
    } catch (err) {
      setStatus('idle')
      if (err instanceof WalletNotFoundError) {
        toast({ tone: 'info', title: `${walletName(err.kind)} not found`, detail: 'Install the extension, or use WalletConnect from your phone.' })
      } else fail(err)
      return false
    }
  }, [finishConnect, addLog, toast, fail])

  // Quietly restore an injected wallet that was connected before (no popup).
  useEffect(() => {
    const last = store.get()
    if (last !== 'metamask' && last !== 'coinbase') return
    const t = setTimeout(async () => {
      const p = last === 'metamask' ? findMetaMask() : findCoinbaseExtension()
      if (!p) return
      try {
        const accounts = (await p.request({ method: 'eth_accounts' })) as string[]
        if (accounts?.length) await finishConnect(last, p, accounts)
      } catch { /* stay disconnected */ }
    }, 400)
    return () => clearTimeout(t)
  }, [finishConnect])

  const disconnect = useCallback(async () => {
    const p = eip.current
    if (kind === 'walletconnect' && p?.disconnect) { try { await p.disconnect() } catch { /* already gone */ } forgetWalletConnect() }
    if (kind === 'coinbase' && p?.disconnect) { try { await p.disconnect() } catch { /* already gone */ } }
    reset(); store.set(null)
    addLog({ tone: 'info', title: 'Disconnected' })
  }, [kind, reset, addLog])

  // ---- network switch (adds the chain if the wallet does not know it) ----
  const switchNetwork = useCallback(async () => {
    const p = eip.current
    if (!p) return
    setBusy('switch')
    try {
      await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: TARGET_CHAIN.hex }] })
    } catch (err) {
      const code = (err as { code?: number; data?: { originalError?: { code?: number } } })?.code
        ?? (err as { data?: { originalError?: { code?: number } } })?.data?.originalError?.code
      if (code === 4902) {
        try {
          await p.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: TARGET_CHAIN.hex, chainName: TARGET_CHAIN.name, nativeCurrency: TARGET_CHAIN.currency,
              rpcUrls: [TARGET_CHAIN.rpc], blockExplorerUrls: [TARGET_CHAIN.explorer],
            }],
          })
          addLog({ tone: 'success', title: `${TARGET_CHAIN.short} added to your wallet` })
        } catch (e2) { fail(e2) }
      } else fail(err)
    } finally { setBusy(null) }
  }, [addLog, fail])

  // ---- Sign-In with Ethereum (EIP-4361 message, no gas) ----
  const getSigner = useCallback(async (): Promise<Signer> => {
    if (demo.current) return demo.current
    const bp = browserProvider()
    if (!bp || !address) throw new Error('not connected')
    return bp.getSigner(address)
  }, [browserProvider, address])

  const signIn = useCallback(async () => {
    if (!address || chainId == null) return
    setBusy('signin')
    const nonce = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    const message = [
      `${location.host} wants you to sign in with your Ethereum account:`,
      address,
      '',
      'Sign in to Ethergate. This request will not trigger a blockchain transaction or cost any gas.',
      '',
      `URI: ${location.origin}${location.pathname}`,
      'Version: 1',
      `Chain ID: ${chainId}`,
      `Nonce: ${nonce}`,
      `Issued At: ${new Date().toISOString()}`,
    ].join('\n')
    const id = addLog({ tone: 'pending', title: 'Waiting for signature', detail: 'Check your wallet.' })
    try {
      const signer = await getSigner()
      const signature = await signer.signMessage(message)
      const recovered = verifyMessage(message, signature)
      if (recovered.toLowerCase() !== address.toLowerCase()) throw new Error('signature mismatch')
      setSession({ message, signature, at: new Date() })
      updateLog(id, { tone: 'success', title: 'Signed in', detail: `Signature verified for ${short(address)}` })
      toast({ tone: 'success', title: 'Signed in', detail: 'Ownership verified. Welcome to the lobby.' })
    } catch (err) {
      const f = friendlyError(err)
      updateLog(id, { tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
      toast({ tone: f.kind === 'rejected' ? 'info' : 'error', title: f.title, detail: f.detail })
    } finally { setBusy(null) }
  }, [address, chainId, getSigner, addLog, updateLog, toast])

  const value = useMemo<Ctx>(() => ({
    status, kind, address, chainId, balance, session, installed, busy, log, toasts, modalOpen,
    wrongNetwork: status === 'connected' && chainId !== TARGET_CHAIN.id,
    openModal: () => setModalOpen(true), closeModal: () => setModalOpen(false),
    connect, disconnect, switchNetwork, signIn, refreshBalance, getSigner, browserProvider,
    addLog, updateLog, toast, dismissToast, setBusy,
  }), [status, kind, address, chainId, balance, session, installed, busy, log, toasts, modalOpen,
    connect, disconnect, switchNetwork, signIn, refreshBalance, getSigner, browserProvider, addLog, updateLog, toast, dismissToast])

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>
}

export function useWallet() {
  const c = useContext(WalletCtx)
  if (!c) throw new Error('useWallet must be inside WalletProvider')
  return c
}

export const short = (a?: string | null) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '')

export const walletName = (k: WalletKind) =>
  ({ metamask: 'MetaMask', walletconnect: 'WalletConnect', coinbase: 'Coinbase Wallet', demo: 'Demo wallet' })[k]
