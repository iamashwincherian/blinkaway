// Stateless pieces shared by server and client components.
export const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`

export const GITHUB = 'https://github.com/iamashwincherian/distant'
export const DOWNLOAD = 'https://github.com/iamashwincherian/distant/releases/latest'
const REL = 'https://github.com/iamashwincherian/distant/releases/download/v1.0.1'
export const DOWNLOAD_MAC = REL + '/Distant-1.0.1-arm64.dmg'
export const DOWNLOAD_WIN = REL + '/Distant-1.0.1-x64.exe'

/* ---------- The ghost (same shapes as the app) ---------- */
const eyes = (y, rx, ry, cls = 'eye') => (
  <g fill="#1d1b16"><ellipse className={cls} cx="44" cy={y} rx={rx} ry={ry} /><ellipse className={cls} cx="57" cy={y} rx={rx} ry={ry} /></g>
)
const FACES = {
  calm: eyes(34, 3.8, 6),
  tired: eyes(36, 3.8, 2.4),
  sad: eyes(40, 3.6, 5),
  blink: eyes(34, 3.8, 6, 'lid'),
  away: <g fill="#1d1b16"><ellipse cx="49" cy="34" rx="3.8" ry="6" /><ellipse cx="62" cy="34" rx="3.8" ry="6" /></g>,
  happy: <path d="M40 36 Q44 29 48 36 M53 36 Q57 29 61 36" fill="none" stroke="#1d1b16" strokeWidth="3.5" strokeLinecap="round" />,
  closed: <path d="M40 35 H48 M53 35 H61" fill="none" stroke="#1d1b16" strokeWidth="4" strokeLinecap="round" />,
}
export const LEAN = { calm: 12, happy: 6, tired: 17, sad: 22, blink: 12, away: 12, closed: 12 }

export function Ghost({ face = 'calm', lean = LEAN[face], className = '', bodyClass = '' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g className={`lean ${bodyClass}`} style={{ transform: `rotate(${lean}deg)` }}>
        <rect x="31" y="14" width="38" height="72" rx="19" fill="#ffce3a" />
        {FACES[face]}
      </g>
    </svg>
  )
}
// The ghost in a sizing box; CSS sizes `.ghost`, the svg fills it.
export const G = ({ c = '', style, ...p }) => <span className={`ghost ${c}`} style={style}><Ghost {...p} /></span>

/* ---------- Icons ---------- */
export const AppleLogo = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M16.5 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2-1.1 2.8-2.3.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.2 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" />
  </svg>
)
export const WindowsLogo = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z" />
  </svg>
)
export const GitHubLogo = props => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
)
const Stroke = ({ d, children, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {d ? <path d={d} /> : children}
  </svg>
)
export const Icon = {
  arrowR: p => <Stroke {...p} d="M5 12h14M13 6l6 6-6 6" />,
  sun: p => <Stroke {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Stroke>,
  moon: p => <Stroke {...p} d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  play: p => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M7 5v14l12-7z" /></svg>,
}

export function DownloadButtons() {
  return (
    <div className="downloads">
      <a className="btn" href={DOWNLOAD_MAC}><AppleLogo />Download for Mac</a>
      <a className="btn btn-line" href={DOWNLOAD_WIN}>Download for Windows</a>
    </div>
  )
}
