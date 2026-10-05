import './globals.css'
import { DOWNLOAD, DOWNLOAD_MAC, DOWNLOAD_WIN, G, GITHUB, GitHubLogo } from './parts'
import { ThemeToggle } from './ui'

export const metadata = {
  title: 'Distant — Smart break reminders for Mac and Windows',
  description: 'Eye breaks, blink and posture reminders that wait for your calls and quietly take care of your screen habits. For macOS and Windows.',
  icons: { icon: '/icon.png', apple: '/icon.png' },
}

// Runs before paint so a saved dark theme never flashes light. Light is the default.
const THEME = `try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'light'}catch(e){}`

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME }} /></head>
      <body>
        <header className="nav">
          <div className="wrap">
            <a className="brand" href="/"><G face="calm" />Distant</a>
            <nav>
              <a href="/#day">How it works</a>
              <a href="/#moods">The ghost</a>
              <a href="/#tune">Customize</a>
              <a href="/#journal">Journal</a>
            </nav>
            <div className="tools">
              <ThemeToggle />
              <a className="icon-btn" href={GITHUB} aria-label="Distant on GitHub"><GitHubLogo /></a>
              <a className="btn btn-sm" href="/#platforms">Download</a>
            </div>
          </div>
        </header>
        {children}
        <footer className="foot">
          <div className="wrap">
            <div className="cols-f">
              <div><b>Product</b><a href={DOWNLOAD_MAC}>Download for Mac</a><a href={DOWNLOAD_WIN}>Download for Windows</a><a href={DOWNLOAD}>Release notes</a></div>
              <div><b>Learn</b><a href="/posts/20-20-20-rule">The 20-20-20 rule</a><a href="/posts/desk-setup">Desk setup</a><a href="/posts/blink-more">Blink more</a></div>
              <div><b>Project</b><a href={GITHUB}>GitHub</a><a href={`${GITHUB}/issues`}>Report an issue</a></div>
              <div><b>Distant</b>Healthier screen habits, mostly out of sight. Free and open source.</div>
            </div>
            <div className="legal"><span>© 2026 Ashwin Cherian Joseph</span><span>Made for eyes that stare at screens all day.</span></div>
          </div>
        </footer>
      </body>
    </html>
  )
}
