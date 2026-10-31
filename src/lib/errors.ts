// Turns wallet / RPC / ethers errors into one plain sentence a player can act on.
// Raw error codes never reach the screen.

type AnyErr = {
  code?: number | string
  message?: string
  shortMessage?: string
  info?: { error?: { code?: number; message?: string } }
  error?: { code?: number; message?: string }
}

export type FriendlyError = { title: string; detail: string; kind: 'rejected' | 'network' | 'funds' | 'pending' | 'unknown' }

export function friendlyError(err: unknown): FriendlyError {
  const e = (err ?? {}) as AnyErr
  const code = e.code ?? e.info?.error?.code ?? e.error?.code
  const msg = `${e.shortMessage ?? ''} ${e.message ?? ''} ${e.info?.error?.message ?? ''}`.toLowerCase()

  if (code === 4001 || code === 'ACTION_REJECTED' || msg.includes('user rejected') || msg.includes('user denied'))
    return { kind: 'rejected', title: 'Request cancelled', detail: 'You cancelled it in your wallet. Nothing was sent.' }
  if (code === -32002 || msg.includes('already pending'))
    return { kind: 'pending', title: 'Wallet is waiting on you', detail: 'There is already a request open. Check your wallet window.' }
  if (code === 'INSUFFICIENT_FUNDS' || msg.includes('insufficient funds'))
    return { kind: 'funds', title: 'Not enough ETH for gas', detail: 'Top up with free Sepolia ETH from a faucet, then try again.' }
  if (code === 4902 || msg.includes('unrecognized chain'))
    return { kind: 'network', title: 'Network missing in wallet', detail: 'Your wallet does not have this network yet. We will add it for you.' }
  if (code === 'CALL_EXCEPTION' || msg.includes('reverted'))
    return { kind: 'unknown', title: 'Transaction reverted', detail: 'The contract said no. No funds moved except gas.' }
  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT' || msg.includes('timeout') || msg.includes('failed to fetch'))
    return { kind: 'network', title: 'Network is slow', detail: 'The RPC did not answer in time. Try again in a moment.' }
  if (msg.includes('project id') || msg.includes('projectid'))
    return { kind: 'unknown', title: 'WalletConnect not configured', detail: 'Add a WalletConnect project ID to enable QR pairing.' }

  return { kind: 'unknown', title: 'Something went wrong', detail: 'Please try again. If it keeps happening, reconnect your wallet.' }
}
