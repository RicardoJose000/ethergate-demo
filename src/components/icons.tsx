// Brand marks for the wallet picker, plus a few UI glyphs.

export const BrandMark = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2ef2d0" /><stop offset="1" stopColor="#3ba9ff" />
      </linearGradient>
    </defs>
    <path d="M32 6 52 18v28L32 58 12 46V18z" fill="none" stroke="url(#bm)" strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M32 20 42 26v12L32 44l-10-6V26z" fill="url(#bm)" />
  </svg>
)

export const MetaMaskLogo = () => (
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <path fill="#E2761B" d="M34.6 5 22 14.3l2.3-5.5z" />
    <path fill="#E4761B" d="m5.4 5 12.5 9.4-2.2-5.6zM30 26.7l-3.4 5.2 7.2 2 2-7.1zM4.2 26.8l2 7.1 7.2-2-3.3-5.2z" />
    <path fill="#E4761B" d="m13 18-2 3 7.1.3-.2-7.6zM27 18l-5-4.4-.1 7.7 7.1-.3zM13.4 31.9l4.3-2.1-3.7-2.9zM22.3 29.8l4.3 2.1-.6-5z" />
    <path fill="#D7C1B3" d="m26.6 31.9-4.3-2.1.3 2.8v1.2zM13.4 31.9l4 1.9v-1.2l.3-2.8z" />
    <path fill="#233447" d="m17.5 25-3.6-1 2.5-1.2zM22.5 25l1.1-2.2 2.5 1.2z" />
    <path fill="#CD6116" d="m13.4 31.9.6-5.2-4 .1zM26 26.7l.6 5.2 3.4-5.1zM29 21l-7.1.3.6 3.7 1.1-2.2 2.5 1.2zM13.9 24l2.5-1.2 1.1 2.2.7-3.7L11 21z" />
    <path fill="#E4751F" d="m11 21 3 5.9-.1-2.9zM26.1 24l-.1 2.9 3-5.9zM18.2 21.3l-.7 3.7.9 4.4.2-5.8zM21.9 21.3l-.4 2.3.2 5.8.9-4.4z" />
    <path fill="#F6851B" d="m22.5 25-.9 4.4.7.4 3.7-2.9.1-2.9zM13.9 24l.1 2.9 3.7 2.9.6-.4-.8-4.4z" />
    <path fill="#C0AD9E" d="M22.6 33.8v-1.2l-.3-.3h-4.6l-.3.3v1.2l-4-1.9 1.4 1.1 2.9 2h4.9l2.9-2 1.4-1.1z" />
    <path fill="#161616" d="m22.3 29.8-.6-.4h-3.4l-.6.4-.3 2.8.3-.3h4.6l.3.3z" />
    <path fill="#763D16" d="m35.2 14.9 1.1-5.3L34.6 5 22.3 14.1l4.7 4 6.7 2 1.5-1.7-.6-.5 1-.9-.8-.6 1-.8zM3.7 9.6l1.1 5.3-.7.5 1 .8-.8.6 1 .9-.6.5 1.5 1.7 6.7-2 4.7-4L5.4 5z" />
    <path fill="#F6851B" d="m33.7 20.1-6.7-2 2 3-3 5.9 4-.1h5.9zM13 18.1l-6.7 2-2.2 6.8H10l4 .1-3-5.9zM21.9 21.3l.4-7.2 1.9-5.3h-8.5l1.9 5.3.4 7.2.2 2.3v5.8h3.4v-5.8z" />
  </svg>
)

export const WalletConnectLogo = () => (
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#3B99FC" />
    <path fill="#fff" d="M12.4 15.6c4.2-4.1 11-4.1 15.2 0l.5.5c.2.2.2.5 0 .7l-1.7 1.7c-.1.1-.3.1-.4 0l-.7-.7c-2.9-2.9-7.7-2.9-10.6 0l-.7.7c-.1.1-.3.1-.4 0l-1.7-1.7c-.2-.2-.2-.5 0-.7zm18.7 3.5 1.5 1.5c.2.2.2.5 0 .7l-6.8 6.6c-.2.2-.5.2-.7 0l-4.8-4.7c-.1-.1-.1-.1-.2 0l-4.8 4.7c-.2.2-.5.2-.7 0l-6.8-6.6c-.2-.2-.2-.5 0-.7l1.5-1.5c.2-.2.5-.2.7 0l4.8 4.7c.1.1.1.1.2 0l4.8-4.7c.2-.2.5-.2.7 0l4.8 4.7c.1.1.1.1.2 0l4.8-4.7c.3-.2.6-.2.8 0z" />
  </svg>
)

export const CoinbaseLogo = () => (
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#0052FF" />
    <circle cx="20" cy="20" r="11" fill="#fff" />
    <rect x="16" y="16" width="8" height="8" rx="1.2" fill="#0052FF" />
  </svg>
)

export const DemoLogo = () => (
  <svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="#2ef2d0" strokeWidth="2">
    <path d="M20 5 33 12.5v15L20 35 7 27.5v-15z" strokeLinejoin="round" />
    <path d="M15 20.5l3.5 3.5L26 16.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Arrow = () => (
  <svg className="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Close = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12" strokeLinecap="round" /></svg>
)

export const Shield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" strokeLinejoin="round" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const Pen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 20h4L19 9l-4-4L4 16z" strokeLinejoin="round" /><path d="m13.5 6.5 4 4" />
  </svg>
)
export const Eye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
