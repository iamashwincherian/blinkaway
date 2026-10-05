'use client'
import { useEffect, useRef, useState } from 'react'
import { AppleLogo, G, Icon, fmt } from './parts'

// A counter that goes up once a second; demos derive their loops from it.
function useTick(ms = 1000) {
  const [k, setK] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setK(k => k + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return k
}

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch {}
  }
  return (
    <button className="icon-btn" type="button" onClick={toggle} aria-label="Switch light or dark mode">
      <Icon.moon className="when-light" /><Icon.sun className="when-dark" />
    </button>
  )
}

// Counts down from `from` to 0:00, then starts over.
export function Countdown({ from }) {
  const k = useTick()
  return fmt(from - (k % (from + 1)))
}

/* ---------- A day with Distant: steps scroll past a pinned Mac screen ---------- */
const Win = ({ title, style, className = '', children }) => (
  <div className={`win ${className}`} style={style}><div className="bar"><i /><i /><i /><span>{title}</span></div>{children}</div>
)
const Doc = ({ lines }) => (
  <Win title="Roadmap.pages" style={{ left: '6%', right: '22%', top: '10cqw', bottom: '6cqw' }}>
    <div className="doc"><b />{lines.map((w, i) => <s key={i} style={{ width: `${w}%` }} />)}</div>
  </Win>
)
const Toast = ({ face = 'calm', lean, bodyClass, title, sub, ring, buttons }) => (
  <div className="toast">
    <div className="row">
      <div className="av">
        {ring && <svg className="ring" viewBox="0 0 48 48"><circle className="tr" cx="24" cy="24" r="22" /><circle className="fl" cx="24" cy="24" r="22" /></svg>}
        <G face={face} lean={lean} bodyClass={bodyClass} />
      </div>
      <div><b>{title}</b><small>{sub}</small></div>
    </div>
    {buttons && <div className="btns"><span>Start now</span><span>+1 min</span><span>+5 min</span><span>Skip</span></div>}
  </div>
)
const Break = ({ bg, face, tag, msg, time, acts }) => (
  <div className={`brk bg-${bg}`}>
    <G c="float" face={face} /><div className="tag">{tag}</div><div className="msg">{msg}</div>
    <div className="time">{time}</div><div className="acts">{acts.map(a => <span key={a}>{a}</span>)}</div>
  </div>
)
const MENU = [['Next break in 25:00', '', 'm'], '-', ['Take a Break Now', '⌥⇧⌘B', 'hl'], ['Take a Long Break'], ['Skip Next Break'], ['Pause', '›'], '-', ['Your Report…'], ['Settings…']]
const CHART = [[5, 1], [4, 2], [6, 0], [3, 1], [7, 1], [6, 0], [9, 1]]

const STEPS = [
  {
    time: '9:00', tray: '25:00', title: 'Quietly there from the first login.',
    body: <>Distant opens at login and lives in your menu bar or system tray, with a live countdown if you like one. Press <kbd>⌥⇧⌘B</kbd> to start a break from anywhere.</>,
    scene: <>
      <Win title="Roadmap.pages" style={{ left: '6%', right: '30%', top: '10cqw', bottom: '6cqw' }}><div className="doc"><b /><s style={{ width: '94%' }} /><s style={{ width: '88%' }} /><s style={{ width: '91%' }} /><s style={{ width: '52%' }} /></div></Win>
      <div className="tmenu">{MENU.map((m, i) => m === '-' ? <hr key={i} /> : <div key={i} className={m[2] || ''}><span>{m[0]}</span><span>{m[1]}</span></div>)}</div>
    </>,
  },
  {
    time: '10:24', tray: '0:10', title: 'Ten seconds’ notice. Every time.',
    body: 'A small heads-up lets you finish the sentence first. Start now, push it a minute or five, or skip this one.',
    scene: <><Doc lines={[94, 88, 91, 70, 84, 30]} /><Toast ring buttons title="Break in 10 seconds" sub="Wrap up your thought. Your eyes are next." /></>,
  },
  {
    time: '10:25', tray: 'Break', title: 'Then every screen goes soft.',
    body: 'The break covers each display with a calm scene and one small thing to do. Skipping unlocks after five seconds, so you have to mean it.',
    scene: <Break bg="dusk" face="calm" tag="Eye break" msg="Look at something 20 feet away." time={<Countdown from={60} />} acts={['+1 min', '+5 min', 'Skip break · Esc']} />,
  },
  {
    time: '11:00', tray: 'On hold', title: 'Your call comes first.',
    body: 'Breaks hold while you’re on a call or watching something, and pick up again with a quiet toast the moment you’re done.',
    holds: ['Microphone in use', 'Video playback', 'Fullscreen apps', 'Away from keyboard', 'Apps you choose'],
    scene: <>
      <Win title="Design review" className="call">
        <div className="tiles">
          {[['AK', '#5b8def,#7a5bef'], ['MR', '#ef8a5b,#ef5b7a'], ['JL', '#3fbf9a,#2a8fbf'], ['You', '#c79a3a,#b0603a']].map(([n, c]) =>
            <div key={n} style={{ background: `linear-gradient(135deg,${c})` }}><i>{n}</i></div>)}
        </div>
        <div className="ctrl"><span /><span /><span /></div>
      </Win>
      <Toast lean={0} title="Break on hold" sub="You’re on a call. It’ll resume when you hang up." />
    </>,
  },
  {
    time: '12:30', tray: 'Lunch', title: 'Lunch, on the schedule.',
    body: 'Fixed-time breaks for lunch or an afternoon walk. They wait for calls to end, and skip themselves if you’ve already stepped away.',
    scene: <Break bg="daylight" face="happy" tag="Lunch" msg="Step outside. The screen will keep." time="30:00" acts={['+5 min', 'End break']} />,
  },
  {
    time: '2:10', tray: '12:08', title: 'Small nudges in between.',
    body: 'Blink and posture reminders slide in at the edge of the screen and never steal focus from what you’re typing.',
    scene: <>
      <Doc lines={[94, 88, 91, 70, 84, 60]} />
      <Toast face="blink" title="Blink" sub="Close your eyes slowly a few times." />
      <Toast lean={0} bodyClass="spine" title="Sit back" sub="Drop your shoulders. Screen at eye level." />
    </>,
  },
  {
    time: '6:00', tray: 'Done', title: 'How did your eyes do today?',
    body: 'Your Report shows today’s breaks, your streaks, a seven-day chart and the hour you skip most often.',
    scene: (
      <Win title="Your Report" className="report">
        <div className="in">
          <div className="halo"><G face="happy" /></div>
          <div><h4>A good day for your eyes.</h4><p>You took every break after lunch.</p></div>
          <div className="tiles"><div><b>9</b><span>Breaks taken</span></div><div><b>1</b><span>Skipped</span></div><div><b>6</b><span>In a row</span></div><div><b>3 PM</b><span>Most skipped</span></div></div>
          <div className="bars">
            {CHART.map(([t, s], i) => (
              <div key={i}><i className="s" style={{ height: `${s * 10}%` }} /><i style={{ height: `${t * 10}%`, transitionDelay: `${i * 60}ms` }} /><small>{'FSSMTWT'[i]}</small></div>
            ))}
          </div>
        </div>
      </Win>
    ),
  },
]

export function DayStory() {
  const [on, setOn] = useState(0)
  const steps = useRef([])
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setOn(+e.target.dataset.i)), { rootMargin: '-45% 0px -45% 0px' })
    steps.current.forEach(s => io.observe(s))
    return () => io.disconnect()
  }, [])
  const ampm = i => (i < 4 ? 'AM' : 'PM')
  return (
    <div className="day-grid">
      <div className="steps">
        {STEPS.map((s, i) => (
          <article key={i} ref={el => { steps.current[i] = el }} data-i={i} className={`step${on === i ? ' on' : ''}`}>
            <time>{s.time} {ampm(i)}</time><h3>{s.title}</h3><p>{s.body}</p>
            {s.holds && <div className="holds">{s.holds.map(h => <span key={h}>{h}</span>)}</div>}
          </article>
        ))}
      </div>
      <div className="stage-col">
        <div className="stage" aria-hidden="true">
          <div className="mbar">
            <AppleLogo className="apple" /><b>Pages</b><span>File</span><span>Edit</span><span>Format</span>
            <span className="r">
              <span className={`tray${on === 0 ? ' hi' : ''}`}><G face="calm" lean={0} /><span>{STEPS[on].tray}</span></span>
              <span className="clock">{STEPS[on].time}</span>
            </span>
          </div>
          {STEPS.map((s, i) => <div key={i} className={`layer${on === i ? ' on' : ''}`}>{s.scene}</div>)}
        </div>
      </div>
    </div>
  )
}

/* ---------- A working copy of the settings window ---------- */
const TABS = [
  ['timers', 'Timers', '#ff9f0a', <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M10 2h4" /></>],
  ['look', 'Break screen', '#5e5ce6', <rect x="3" y="5" width="18" height="14" rx="2" />],
  ['sound', 'Sounds', '#ff375f', <path d="M4 9v6h4l5 4V5L8 9zM17 9a4 4 0 0 1 0 6" />],
  ['msgs', 'Messages', '#30d158', <path d="M4 5h16v11H9l-5 4z" />],
  ['ex', 'Exercises', '#0a84ff', <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></>],
]
const TIMERS = [
  ['Take a break every', 25, 5, 5, 90, 'min'], ['Break length', 60, 10, 20, 300, 'sec'],
  ['Long break after every', 3, 1, 2, 8, 'breaks'], ['Heads-up before a break', 10, 5, 5, 60, 'sec'],
]
const BGS = ['honey', 'daylight', 'dusk', 'ocean', 'forest', 'ember']
const EXERCISES = [
  ['follow', 'Follow the ghost', 'Head still, eyes only.', 'calm'], ['blink', 'Slow blinks', 'Close gently, hold, open.', 'blink'],
  ['palm', 'Palming', 'Warm palms over closed eyes.', 'closed'], ['far', 'Look far', 'Rest on the farthest thing.', 'calm'],
]
const CHIMES = [['Break starts', [783.99, 659.25]], ['Break ends', [523.25, 659.25, 783.99]]]

function Stepper({ label, init, step, min, max, unit }) {
  const [v, setV] = useState(init)
  const set = n => setV(Math.min(max, Math.max(min, n)))
  return (
    <div><span>{label}</span>
      <span className="stepper">
        <button type="button" aria-label={`Less: ${label}`} onClick={() => set(v - step)}>−</button>
        <output>{v} {unit}</output>
        <button type="button" aria-label={`More: ${label}`} onClick={() => set(v + step)}>+</button>
      </span>
    </div>
  )
}

// Same chimes the app plays, straight from Web Audio.
function Chime({ label, notes }) {
  const [playing, setPlaying] = useState(false)
  const play = () => {
    const ac = new AudioContext()
    notes.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.16
      o.frequency.value = f
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.18, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
      o.connect(g).connect(ac.destination)
      o.start(t); o.stop(t + 1.5)
    })
    setPlaying(true)
    setTimeout(() => setPlaying(false), 1600)
  }
  return <div><span>{label}</span><button className={`sound-btn${playing ? ' playing' : ''}`} type="button" onClick={play}><Icon.play />Play</button></div>
}

export function Prefs() {
  const [tab, setTab] = useState('timers')
  const [bg, setBg] = useState('dusk')
  const [ex, setEx] = useState(EXERCISES[0])
  return (
    <div className="prefs reveal">
      <aside role="tablist" aria-label="Settings">
        <div className="lights"><i /><i /><i /></div>
        {TABS.map(([id, label, color, icon]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            <em style={{ background: color }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></em>{label}
          </button>
        ))}
      </aside>
      <div>
        {tab === 'timers' && <div className="pane on">
          <h3>Timers</h3><p>Defaults follow the 20-20-20 rule, give or take.</p>
          <div className="group">{TIMERS.map(([label, init, step, min, max, unit]) => <Stepper key={label} {...{ label, init, step, min, max, unit }} />)}</div>
        </div>}
        {tab === 'look' && <div className="pane on">
          <h3>Break screen</h3><p>Six backgrounds, on every display.</p>
          <div className={`preview bg-${bg}`}>
            <div className="brk"><G c="float" face="calm" /><div className="tag">Eye break</div><div className="msg">Look at something 20 feet away.</div><div className="time"><Countdown from={20} /></div></div>
          </div>
          <div className="swatches" role="radiogroup" aria-label="Background">
            {BGS.map(b => <button key={b} type="button" role="radio" aria-checked={bg === b} aria-label={b} className={`swatch bg-${b}`} onClick={() => setBg(b)} />)}
          </div>
          <p className="sw-label">{bg}</p>
        </div>}
        {tab === 'sound' && <div className="pane on">
          <h3>Sounds</h3><p>A soft chime when a break starts and when it ends.</p>
          <div className="group">{CHIMES.map(([label, notes]) => <Chime key={label} label={label} notes={notes} />)}</div>
        </div>}
        {tab === 'msgs' && <div className="pane on">
          <h3>Messages</h3><p>Shown on the break screen, one at a time.</p>
          <div className="group msgs">
            <div>Look at something 20 feet away.</div>
            <div>Roll your shoulders and unclench your jaw.</div>
            <div>Stand up, stretch, grab some water.</div>
            <div style={{ color: 'var(--muted)' }}>Call Mom back<span className="caret" /></div>
          </div>
        </div>}
        {tab === 'ex' && <div className="pane on">
          <h3>Exercises</h3><p>The ghost leads. You follow along.</p>
          <div className={`ex-stage bg-honey ${ex[0]}`}><G face={ex[3]} lean={0} /></div>
          <div className="ex-grid">
            {EXERCISES.map(e => (
              <button key={e[0]} type="button" className="ex" aria-pressed={ex === e} onClick={() => setEx(e)}><b>{e[1]}</b><span>{e[2]}</span></button>
            ))}
          </div>
        </div>}
      </div>
    </div>
  )
}
