'use client'
import { useEffect, useState } from 'react'
import { BreakScreen, Desktop, Ghost, Icon, Toast } from './parts'

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

const MESSAGES = ['Look at something 20 feet away.', 'Roll your shoulders and unclench your jaw.', 'Stand up, stretch, grab some water.']
export function HeroBreak() {
  const k = useTick()
  const t = Math.max(0, 12 - (k % 16))
  return <BreakScreen bg="honey" t={t} total={12} msg={MESSAGES[Math.floor(k / 16) % MESSAGES.length]} className="hero-break" />
}

// Heads-up counts down in the corner, then the break fades in over the desktop, then it all starts again.
export function FlowDemo() {
  const k = useTick() % 19
  const t = Math.max(0, 10 - k)
  const onBreak = k > 10
  const bt = Math.max(0, 6 - (k - 11))
  return (
    <Desktop wall="sunrise" timer={`0:${String(t).padStart(2, '0')}`} className="flow-demo">
      <div className="app-win" aria-hidden="true">
        <div className="aw-bar"><i /><i /><i /><span>Q4 plan.md</span></div>
        <div className="aw-body">
          <b /><span style={{ width: '92%' }} /><span style={{ width: '84%' }} /><span style={{ width: '88%' }} /><span style={{ width: '40%' }} />
          <b style={{ width: '30%' }} /><span style={{ width: '90%' }} /><span style={{ width: '76%' }} /><span className="typing" />
        </div>
      </div>
      <div className={`toast-slot${onBreak ? ' out' : ''}`}>
        <Toast title={<>Break in <span className="num">{t}s</span></>} sub="Wrap up your thought — time to rest your eyes." ring={t / 10} buttons />
      </div>
      <div className={`overlay${onBreak ? ' in' : ''}`}>
        <BreakScreen bg="dusk" t={bt} total={6} msg="Look at something 20 feet away." />
      </div>
    </Desktop>
  )
}

/* ---------- Notes from the ghost: stacked cards ---------- */
const NOTES = [
  { face: 'calm', quote: 'Every 20 minutes, look at something 20 feet away for 20 seconds.', who: 'The 20-20-20 rule', role: 'What eye-care professionals recommend' },
  { face: 'blink', quote: 'Screens make us forget to blink. A tiny nudge every few minutes is all it takes to remember.', who: 'Blink reminders', role: 'Gentle, and they never take focus' },
  { face: 'away', quote: 'A break that interrupts your meeting is a break you’ll skip. So I wait until you hang up.', who: 'Smart pause', role: 'Calls, video and fullscreen apps' },
  { face: 'tired', quote: 'Skip a few breaks and I get tired. Keep a streak going and I’m all smiles.', who: 'Ghost moods', role: 'A little nudge, never a guilt trip' },
  { face: 'happy', quote: 'Sit back, drop your shoulders, screen at eye level. Your back will thank you too.', who: 'Posture nudges', role: 'Because it’s not only your eyes' },
]
export function NotesStack() {
  const [i, setI] = useState(0)
  const n = NOTES.length
  useEffect(() => {
    const id = setTimeout(() => setI(i => (i + 1) % n), 7000)
    return () => clearTimeout(id)
  }, [i, n])
  return (
    <div className="notes">
      <div className="stack">
        {NOTES.map((note, idx) => {
          const d = (idx - i + n) % n
          return (
            <figure key={note.who} className="note" aria-hidden={d !== 0}
              style={{ zIndex: n - d, opacity: d > 2 ? 0 : 1, transform: `translateY(${-d * 16}px) scale(${1 - d * 0.045})` }}>
              <blockquote style={{ opacity: d ? 0 : 1 }}>“{note.quote}”</blockquote>
              <figcaption style={{ opacity: d ? 0 : 1 }}>
                <span className="halo"><Ghost face={note.face} /></span>
                <span><b>{note.who}</b><small>{note.role}</small></span>
              </figcaption>
            </figure>
          )
        })}
      </div>
      <div className="stack-nav">
        <button type="button" className="icon-btn" aria-label="Previous" onClick={() => setI((i - 1 + n) % n)}><Icon.arrowL /></button>
        <span className="dots">{NOTES.map((_, idx) => <i key={idx} className={idx === i ? 'on' : ''} />)}</span>
        <button type="button" className="icon-btn" aria-label="Next" onClick={() => setI((i + 1) % n)}><Icon.arrowR /></button>
      </div>
    </div>
  )
}

/* ---------- Customisation demos ---------- */
const BGS = ['honey', 'night', 'dusk', 'ocean', 'forest', 'ember']
export function Ambiance() {
  const [bg, setBg] = useState('dusk')
  const k = useTick()
  return (
    <div className="ambiance">
      <BreakScreen bg={bg} t={Math.max(0, 20 - (k % 24))} total={20} msg="Look at something 20 feet away." />
      <div className="swatches" role="radiogroup" aria-label="Break background">
        {BGS.map(b => (
          <button key={b} type="button" role="radio" aria-checked={bg === b} className={`swatch bg-${b}`} onClick={() => setBg(b)}>
            <span>{b}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const EXERCISES = [
  ['follow', 'Follow the ghost', 'Keep your head still and follow the ghost with your eyes.'],
  ['blink', 'Blink along', 'Slow, full blinks. Close gently, hold a moment, open.'],
  ['palm', 'Palming', 'Cup your warm palms over your closed eyes.'],
  ['far', 'Look far', 'Find the farthest thing you can see and rest your eyes on it.'],
]
export function Exercises() {
  const k = useTick(5000)
  const [id, tag, msg] = EXERCISES[k % EXERCISES.length]
  return (
    <div className={`mini bg-night ex-${id}`}>
      <div className="mini-ghost"><Ghost face={id === 'palm' ? 'closed' : 'calm'} className="float" /></div>
      <div className="break-tag">{tag}</div>
      <p>{msg}</p>
    </div>
  )
}

// Same two chimes the app plays, straight from Web Audio.
export function Chimes() {
  const [playing, setPlaying] = useState('')
  const play = (name, notes) => {
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
    setPlaying(name)
    setTimeout(() => setPlaying(''), 1600)
  }
  return (
    <div className={`chimes${playing ? ' playing' : ''}`}>
      <div className="pulse"><i /><i /><i /><Icon.sound /></div>
      <div className="chime-btns">
        <button type="button" className="btn btn-quiet" onClick={() => play('start', [783.99, 659.25])}>Break starts</button>
        <button type="button" className="btn btn-quiet" onClick={() => play('end', [523.25, 659.25, 783.99])}>Break ends</button>
      </div>
    </div>
  )
}
