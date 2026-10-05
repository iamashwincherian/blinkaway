// Stateless pieces shared by server and client components.
const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`

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
  eye: p => <Stroke {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Stroke>,
  flow: p => <Stroke {...p} d="M4 12c3-6 5-6 8 0s5 6 8 0" />,
  spark: p => <Stroke {...p} d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  bell: p => <Stroke {...p} d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" />,
  bar: p => <Stroke {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M15 6.5h3" /></Stroke>,
  lock: p => <Stroke {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Stroke>,
  mic: p => <Stroke {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Stroke>,
  play: p => <Stroke {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3z" /></Stroke>,
  full: p => <Stroke {...p} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  cup: p => <Stroke {...p} d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3" />,
  apps: p => <Stroke {...p}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></Stroke>,
  arrowL: p => <Stroke {...p} d="M19 12H5M11 6l-6 6 6 6" />,
  arrowR: p => <Stroke {...p} d="M5 12h14M13 6l6 6-6 6" />,
  sun: p => <Stroke {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Stroke>,
  moon: p => <Stroke {...p} d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  sound: p => <Stroke {...p} d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />,
}

export function DownloadButtons({ small }) {
  return (
    <div className={`downloads${small ? ' small' : ''}`}>
      <a className="btn" href={DOWNLOAD_MAC}><AppleLogo />Download for Mac</a>
      <a className="btn btn-quiet" href={DOWNLOAD_WIN}><WindowsLogo />Download for Windows</a>
    </div>
  )
}

/* ---------- Break screen (mirrors break.html, sized in container units) ---------- */
export function BreakScreen({ bg = 'honey', t, total, msg, tag = 'Eye break', face = 'calm', className = '', children }) {
  const done = t === 0
  return (
    <div className={`break bg-${bg}${done ? ' done' : ''} ${className}`}>
      <div className="break-ghost">
        <div className="orb" />
        <Ghost face={done ? 'happy' : face} lean={done ? 0 : LEAN[face]} className="float" />
        <div className="shadow" />
      </div>
      <div className="break-tag">{done ? 'Break complete' : tag}</div>
      <div className="break-msg">{done ? 'Welcome back. Your eyes feel better already.' : msg}</div>
      <div className="break-time">{fmt(t)}</div>
      <div className="break-bar"><i style={{ width: `${(t / total) * 100}%`, transition: t === total ? 'none' : undefined }} /></div>
      <div className="break-actions"><span>+1 min</span><span>+5 min</span><span>Skip break <kbd>Esc</kbd></span></div>
      {children}
    </div>
  )
}

/* ---------- Desktops: macOS menu bar or Windows taskbar around a wallpaper ---------- */
function MenuBar({ timer }) {
  return (
    <div className="menubar">
      <AppleLogo className="mb-apple" />
      <b>Finder</b><span>File</span><span>Edit</span><span>View</span><span className="hide-sm">Go</span><span className="hide-sm">Window</span>
      <span className="mb-right">
        <span className="tray"><Ghost face="calm" className="tray-ghost" />{timer}</span>
        <span className="hide-sm">Thu 1 Oct</span><span>9:41</span>
      </span>
    </div>
  )
}
function Taskbar({ children }) {
  return (
    <div className="taskbar">
      <span className="tb-apps">
        <WindowsLogo className="tb-win" />
        <i style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }} />
        <i style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }} />
        <i style={{ background: 'linear-gradient(135deg,#22c55e,#14b8a6)' }} />
        <i style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)' }} />
      </span>
      <span className="tb-tray">{children}<Ghost face="calm" className="tray-ghost" /><span className="tb-clock">9:41 AM<br />01/10/2026</span></span>
    </div>
  )
}
export function Desktop({ os = 'mac', wall = 'sunrise', timer = '18:24', className = '', children }) {
  return (
    <div className={`desktop wall-${wall} ${className}`}>
      {os === 'mac' && <MenuBar timer={timer} />}
      {children}
      {os === 'win' && <Taskbar />}
    </div>
  )
}

/* ---------- Toasts (mirror toast.html) ---------- */
export function Toast({ face = 'calm', title, sub, ring, bodyClass, buttons }) {
  return (
    <div className="toast">
      <div className="toast-row">
        <div className="avatar">
          {ring != null && (
            <svg className="ring" viewBox="0 0 48 48"><circle className="track" cx="24" cy="24" r="22" /><circle className="fill" cx="24" cy="24" r="22" style={{ strokeDashoffset: 138.2 * (1 - ring) }} /></svg>
          )}
          <Ghost face={face} lean={bodyClass ? 0 : undefined} bodyClass={bodyClass} />
        </div>
        <div><b>{title}</b><small>{sub}</small></div>
      </div>
      {buttons && (
        <div className="toast-btns"><span className="primary">Start now</span><span>+1 min</span><span>+5 min</span><span>Skip</span></div>
      )}
    </div>
  )
}

/* ---------- Tray menus (the app's real menu) ---------- */
const MENU = [
  ['Next break in 18:24', '', 'muted'], '-',
  ['Take a Break Now', 'kbd'], ['Take a Long Break'], ['Skip Next Break'], ['Pause', '›'], '-',
  ['Your Report…'], ['Settings…'], ['Quit Distant'],
]
export function TrayMenu({ os }) {
  return (
    <div className={`traymenu traymenu-${os}`}>
      {MENU.map((m, i) => m === '-'
        ? <hr key={i} />
        : <div key={i} className={m[2] || ''}><span>{m[0]}</span><span>{m[1] === 'kbd' ? (os === 'mac' ? '⌥⇧⌘B' : 'Ctrl+Alt+Shift+B') : m[1]}</span></div>)}
    </div>
  )
}

