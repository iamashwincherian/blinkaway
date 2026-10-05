import { POSTS } from './posts'
import { AppleLogo, DOWNLOAD_MAC, DOWNLOAD_WIN, DownloadButtons, G, Icon, WindowsLogo } from './parts'
import { Countdown, DayStory, Prefs } from './ui'

const Hills = ({ className, viewBox, paths }) => (
  <svg className={className} viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
    {paths.map((d, i) => <path key={d} d={d} fill={`var(--hill-${i + 1})`} />)}
  </svg>
)

const MOODS = [['happy', 'Happy', 'Five breaks in a row.'], ['calm', 'Calm', 'Right on schedule.'], ['tired', 'Tired', 'A couple of skips.'], ['sad', 'Sad', 'It’s been a while.']]

const PLATFORMS = [
  { Logo: AppleLogo, name: 'macOS', sub: 'Apple silicon', href: DOWNLOAD_MAC, file: '.dmg', home: 'The menu bar, with a countdown by the clock', key: '⌥⇧⌘B', holds: 'Calls, microphone use, video, time away' },
  { Logo: WindowsLogo, name: 'Windows', sub: 'Windows 10 and 11', href: DOWNLOAD_WIN, file: '.exe', home: 'The system tray', key: 'Ctrl+Alt+Shift+B', holds: 'Calls, microphone use, video, games & presentations' },
]

const FAQ = [
  ['Is Distant really free?', 'Yes. It’s free and open source, and the code is on GitHub.'],
  ['Will a break interrupt my call?', 'No. Breaks wait while any app is using your microphone or a video is playing, and on Windows while a fullscreen app is open. A toast tells you when a break is on hold and when it’s back.'],
  ['What if I’ve already stepped away?', 'Time away from the keyboard counts as a break, so Distant won’t ask for another one the moment you sit back down.'],
  ['Can I turn it off for a while?', 'Pause for 30 minutes, an hour, two hours or until you resume, or skip just the next break. It’s all in the menu bar or tray.'],
  ['How often will it ask me to take a break?', 'By default, a 60-second break every 25 minutes and a longer one every few breaks. Every number is yours to change.'],
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-copy">
            <p className="eyebrow">Distant for Mac and Windows</p>
            <h1>Give your eyes <span>some</span> distance.</h1>
            <p className="lede">A break timer that knows when not to interrupt. It waits out your calls, nudges you to blink and sit back, and asks for twenty seconds of looking far away.</p>
            <div className="cta">
              <a className="btn" href={DOWNLOAD_MAC}><AppleLogo />Download for Mac</a>
              <a className="link" href={DOWNLOAD_WIN}>Get it for Windows</a>
            </div>
            <p className="fine">Free and open source · Version 1.0.1</p>
          </div>
          <div className="scene" aria-hidden="true">
            <div className="sun" />
            <Hills className="hills" viewBox="0 0 400 220" paths={['M0 40 Q80 18 160 34 T320 26 T400 30 V220 H0Z', 'M0 88 Q100 56 210 80 T400 70 V220 H0Z', 'M0 150 Q120 118 250 140 T400 128 V220 H0Z']} />
            <div className="dim"><span>20 ft</span></div>
            <div className="hero-ghost"><G c="float" face="calm" lean={18} /><div className="shadow" /></div>
            <div className="chip"><b>Eye break</b>Look at something far away<span className="t"><Countdown from={20} /></span></div>
          </div>
        </div>
      </section>

      {/* 20-20-20, read like an eye chart */}
      <section className="section chart-sec">
        <div className="wrap">
          <p className="eyebrow reveal">The 20-20-20 rule</p>
          <h2 className="sec-title reveal">Read it from where you sit.</h2>
          <div className="chart">
            {[['l1', 'Every 20 minutes', '20/200'], ['l2', 'Look 20 feet away', '20/100'], ['l3', 'For 20 seconds', '20/50'], ['l4', 'If you can read this line, you’re sitting too close', '20/20']].map(([l, text, acuity], i) => (
              <div className="row" key={l}><small>{i + 1}</small><div className={`line ${l}`}>{text}</div><small>{acuity}</small></div>
            ))}
          </div>
          <p className="chart-note reveal">Eye-care professionals have recommended it for years. Distant just does the counting, so you don’t have to.</p>
        </div>
      </section>

      {/* A day with Distant */}
      <section className="section day" id="day">
        <div className="wrap">
          <p className="eyebrow reveal">How it works</p>
          <h2 className="sec-title reveal">A workday,<br />with room to breathe.</h2>
          <DayStory />
        </div>
      </section>

      {/* Moods */}
      <section className="section moods" id="moods">
        <div className="wrap">
          <p className="eyebrow reveal" style={{ color: '#a1a1a6' }}>The ghost</p>
          <h2 className="sec-title reveal">It notices.<br />It never nags.</h2>
          <p className="sec-lede reveal">The little ghost in your menu bar reflects how your day is going. Keep a streak and it lights up. Skip a few and it gets sleepy. No badges, no guilt.</p>
          <div className="mood-row">
            {MOODS.map(([face, name, line], i) => (
              <div className="mood reveal" key={face}>
                <G c="float" face={face} style={{ animationDelay: `${-i * 1.2}s` }} />
                <h3>{name}</h3><p>{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Settings */}
      <section className="section tune" id="tune">
        <div className="wrap">
          <p className="eyebrow reveal">Customize</p>
          <h2 className="sec-title reveal">Set it once.<br />Then forget it’s there.</h2>
          <p className="sec-lede reveal">Timers, backgrounds, chimes, messages and guided exercises. <b>Try the settings right here.</b></p>
          <Prefs />
        </div>
      </section>

      {/* Mac & Windows */}
      <section className="section compare" id="platforms">
        <div className="wrap">
          <p className="eyebrow reveal">Mac &amp; Windows</p>
          <h2 className="sec-title reveal">At home on both.</h2>
          <div className="cols">
            {PLATFORMS.map(({ Logo, name, sub, href, file, home, key, holds }) => (
              <div className="col reveal" key={name}>
                <Logo /><h3>{name}</h3><p className="sub">{sub}</p>
                <a className="btn" href={href}>Download {file}</a>
                <div className="spec">
                  <div><small>Lives in</small><span>{home}</span></div>
                  <div><small>Shortcut</small><span><kbd>{key}</kbd></span></div>
                  <div><small>Holds breaks for</small><span>{holds}</span></div>
                  <div><small>Also</small><span>Every display · Open at login · Light &amp; dark</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq">
        <div className="wrap">
          <div><p className="eyebrow reveal">Questions</p><h2 className="sec-title reveal">Good to know.</h2></div>
          <div className="qa reveal">
            {FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>

      {/* Journal */}
      <section className="section journal" id="journal">
        <div className="wrap">
          <div className="head"><div><p className="eyebrow reveal">Journal</p><h2 className="sec-title reveal">Notes on screens<br />and the eyes behind them.</h2></div></div>
          <div className="entries">
            {POSTS.map(p => (
              <a className="entry reveal" key={p.slug} href={`/posts/${p.slug}`}>
                <small>{p.kind === 'update' ? `${p.date} · Update` : 'Guide'}</small>
                <div><h3>{p.title}</h3><p>{p.summary}</p></div>
                <span className="arrow"><Icon.arrowR /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final">
        <div className="wrap">
          <h2 className="reveal">Look up.<br />We’ll keep time.</h2>
          <p className="reveal">Free for Mac and Windows. Set up in a minute, then mostly out of sight.</p>
          <div className="cta reveal"><DownloadButtons /></div>
        </div>
        <div className="horizon" aria-hidden="true">
          <div className="sun" />
          <Hills className="h" viewBox="0 0 1440 160" paths={['M0 50 Q300 20 620 44 T1440 36 V160 H0Z', 'M0 96 Q360 64 760 90 T1440 80 V160 H0Z', 'M0 132 Q420 110 900 128 T1440 120 V160 H0Z']} />
          <G c="float" face="calm" lean={18} />
        </div>
      </section>
    </main>
  )
}
