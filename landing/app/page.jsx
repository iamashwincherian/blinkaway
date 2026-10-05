import { POSTS } from './posts'
import { Desktop, DownloadButtons, Ghost, Icon, Toast, TrayMenu } from './parts'
import { Ambiance, Chimes, Exercises, FlowDemo, HeroBreak, NotesStack } from './ui'

const Head = ({ id, title, children }) => (
  <div className="sec-head reveal" id={id}>
    <h2>{title}</h2>
    {children && <p>{children}</p>}
  </div>
)

function PostCard({ p }) {
  return (
    <a className="post reveal" href={`/posts/${p.slug}`}>
      <div className={`post-art bg-${p.bg}`}><Ghost face={p.face} className="float" /></div>
      <div className="post-body">
        <small>{p.kind === 'update' ? p.date : 'Guide'}</small>
        <h3>{p.title}</h3>
        <p>{p.summary}</p>
        <span className="btn btn-ghost">Read more</span>
      </div>
    </a>
  )
}

const HOLDS = [
  [Icon.mic, 'Meetings & calls'], [Icon.play, 'Video playback'], [Icon.full, 'Fullscreen apps & games'],
  [Icon.cup, 'Time away from keyboard'], [Icon.apps, 'Apps you choose'],
]
const CHART = [[5, 1], [4, 2], [6, 0], [3, 1], [5, 2], [6, 0], [4, 0]]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero wrap">
        <a className="pill-note" href="#platforms">
          <b>BlinkAway 1.0</b><span className="sep" />Now on Mac and Windows<Icon.arrowR />
        </a>
        <img className="app-icon" src="/icon.png" alt="BlinkAway app icon" width="110" height="110" />
        <h1>The break app<br />your eyes thank you for</h1>
        <p className="lede">A smart break reminder for Mac and Windows — eye breaks, blink and posture nudges that quietly take care of your screen habits while you work.</p>
        <DownloadButtons />
        <p className="meta"><span>v1.0.0</span><span>macOS</span><span>Windows 10 &amp; 11</span></p>
      </section>
      <div className="wrap"><div className="hero-shot reveal"><HeroBreak /></div></div>

      {/* Benefits */}
      <div className="wrap benefits">
        <div className="reveal"><Icon.eye /><p>Less eye strain.<br />Less screen fatigue.</p></div>
        <div className="reveal"><Icon.flow /><p>Breaks that don’t<br />break your flow</p></div>
        <div className="reveal"><Icon.spark /><p>Healthier screen habits,<br />automatically</p></div>
      </div>

      <div className="wrap"><NotesStack /></div>

      {/* Flow */}
      <Head id="flow" title="Breaks that don’t break your flow">
        BlinkAway waits for the right moment to show a break,<br className="hide-sm" /> and gives you a heads-up beforehand.
      </Head>
      <div className="wrap">
        <div className="reveal"><FlowDemo /></div>
        <div className="features reveal">
          <div><Icon.bell /><h3>Heads-up notifications</h3><p>Start now, snooze by a minute or five, or skip — without leaving what you’re doing.</p></div>
          <div><Icon.bar /><h3>Menu bar &amp; tray control</h3><p>A live countdown in the Mac menu bar, and quick controls from the tray on Windows.</p></div>
          <div><Icon.lock /><h3>A skip you have to mean</h3><p>Skipping unlocks after five seconds, so a break can’t be dismissed by reflex.</p></div>
        </div>
        <p className="caps center reveal">Automatically holds breaks during</p>
        <div className="chips reveal">
          {HOLDS.map(([I, label]) => <span key={label}><I />{label}</span>)}
        </div>
      </div>

      {/* Mac & Windows */}
      <Head id="platforms" title={<>Step away<br />on any desktop</>}>
        BlinkAway is at home on macOS and Windows. Breaks cover every display, and one shortcut starts a break from anywhere.
      </Head>
      <div className="wrap platforms">
        <figure className="reveal">
          <Desktop os="mac" wall="ocean"><div className="menu-anchor mac"><TrayMenu os="mac" /></div></Desktop>
          <figcaption><b>macOS</b>Lives in your menu bar, with an optional countdown right next to the clock.</figcaption>
        </figure>
        <figure className="reveal">
          <Desktop os="win" wall="bloom"><div className="menu-anchor win"><TrayMenu os="win" /></div></Desktop>
          <figcaption><b>Windows</b>Sits in the system tray, and holds breaks for games, fullscreen video and presentations.</figcaption>
        </figure>
      </div>

      {/* Wellness */}
      <Head id="wellness" title="Posture & blink reminders">
        Keep your posture and blink rate in check with gentle reminders that never steal focus.
      </Head>
      <div className="wrap wellness">
        <figure className="reveal">
          <Desktop wall="sunrise" timer="12:08">
            <div className="big-ghost"><Ghost face="blink" /></div>
            <div className="toast-slot"><Toast face="blink" title="Blink" sub="Close your eyes slowly a few times. Screens make us forget." /></div>
          </Desktop>
          <figcaption>Blink reminders</figcaption>
        </figure>
        <figure className="reveal">
          <Desktop wall="dawn" timer="12:08">
            <div className="big-ghost"><Ghost face="calm" lean={0} bodyClass="spine" /></div>
            <div className="toast-slot"><Toast face="calm" bodyClass="spine" title="Check your posture" sub="Sit back, drop your shoulders, screen at eye level." /></div>
          </Desktop>
          <figcaption>Posture reminders</figcaption>
        </figure>
      </div>

      {/* Customize */}
      <section className="band" id="customize">
        <Head title={<>Fits your workflow<br />like a glove</>}>
          Tune timers, sounds, backgrounds, messages and exercises to make every break your own.
        </Head>
        <div className="wrap">
          <div className="card card-wide reveal">
            <Ambiance />
            <p className="caps">Set the perfect break ambiance with six calming backgrounds</p>
          </div>
          <div className="grid3">
            <div className="card reveal"><Exercises /><p className="caps">Guided eye exercises, led by the ghost</p></div>
            <div className="card reveal"><Chimes /><p className="caps">A soft chime when a break starts and ends</p></div>
            <div className="card reveal">
              <div className="messages">
                <span>Look at something 20 feet away.</span>
                <span>Roll your shoulders and unclench your jaw.</span>
                <span>Stand up, stretch, grab some water.<i className="caret" /></span>
              </div>
              <p className="caps">Add personal messages to keep you motivated</p>
            </div>
          </div>
          <div className="grid2">
            <div className="card reveal">
              <div className="rows">
                <div><span>Take a break every</span><b>25 min</b></div>
                <div><span>Break length</span><b>60 sec</b></div>
                <div><span>Long break after every</span><b>3 breaks</b></div>
                <div><span>Heads-up before a break</span><b>10 sec</b></div>
              </div>
              <p className="caps">Timers that match how you work</p>
            </div>
            <div className="card reveal">
              <div className="rows">
                <div><span><b>12:30</b> Lunch</span><b>30 min</b></div>
                <div><span><b>16:00</b> Afternoon walk</span><b>15 min</b></div>
                <div className="muted"><span>Waits for calls to end. Skipped if you’re already away.</span></div>
              </div>
              <p className="caps">Fixed-time breaks for lunch and walks</p>
            </div>
          </div>
          <div className="card card-wide report reveal">
            <div className="report-mood">
              <span className="halo"><Ghost face="happy" /></span>
              <div><h3>See how your eyes are doing</h3><p>The ghost’s mood, today’s breaks, your streaks, a 7-day chart — and the hour you skip most.</p></div>
            </div>
            <div className="report-data">
              <div className="tiles">
                <div><b>6</b><span>Breaks taken</span></div><div><b>1</b><span>Skipped</span></div>
                <div><b>5</b><span>Current streak</span></div><div><b>8</b><span>Best streak</span></div>
              </div>
              <div className="chart" aria-label="Breaks over the last 7 days">
                {CHART.map(([t, s], i) => (
                  <div key={i}>{s > 0 && <i className="s" style={{ height: s * 14 }} />}<i className="t" style={{ height: t * 14 }} /><small>{['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Today'][i]}</small></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for */}
      <div className="split-bg">
        <div className="wrap">
          <div className="designed reveal">
            <Ghost face="happy" className="designed-ghost float" />
            <p className="caps">Designed for</p>
            <h2>Mac &amp; Windows</h2>
            <p>A native menu bar and system tray app with a global keyboard shortcut, breaks on every display, open at login, and light and dark appearance that follows your system.</p>
            <DownloadButtons />
          </div>
        </div>
      </div>

      {/* Posts */}
      <Head id="updates" title="Recent updates" />
      <div className="wrap posts">{POSTS.filter(p => p.kind === 'update').map(p => <PostCard key={p.slug} p={p} />)}</div>
      <Head id="guides" title="Eye care guides for screen workers" />
      <div className="wrap posts">{POSTS.filter(p => p.kind === 'guide').map(p => <PostCard key={p.slug} p={p} />)}</div>
    </main>
  )
}
