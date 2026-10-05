import './globals.css'
import { DOWNLOAD, DOWNLOAD_MAC, DOWNLOAD_WIN } from './parts'
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
        <header className="header">
          <a className="logo" href="/"><img src="/icon.png" alt="" width="28" height="28" />Distant</a>
          <nav>
            <a href="/#flow">Features</a>
            <a href="/#wellness">Wellness</a>
            <a href="/#customize">Customize</a>
            <a href="/#updates">Updates</a>
          </nav>
          <ThemeToggle />
          <a className="btn btn-sm" href={DOWNLOAD}>Download</a>
        </header>
        {children}
        <footer className="footer">
          <div className="wrap footer-in">
            <div>
              <a className="logo" href="/"><img src="/icon.png" alt="" width="28" height="28" />Distant</a>
              <p>Healthier screen habits, on autopilot.<br />© 2026 Ashwin Cherian Joseph</p>
            </div>
            <div className="footer-cols">
              <div><b>Product</b><a href={DOWNLOAD_MAC}>Download for Mac</a><a href={DOWNLOAD_WIN}>Download for Windows</a><a href="/#updates">What’s new</a><a href="https://github.com/iamashwincherian/distant">GitHub</a></div>
              <div><b>Features</b><a href="/#flow">Smart breaks</a><a href="/#wellness">Blink &amp; posture</a><a href="/#customize">Customize</a><a href="/#platforms">Mac &amp; Windows</a></div>
              <div><b>Resources</b><a href="/posts/20-20-20-rule">The 20-20-20 rule</a><a href="/posts/desk-setup">Desk setup</a><a href="/posts/blink-more">Blink more</a></div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
