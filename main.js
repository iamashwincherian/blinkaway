const { app, BrowserWindow, Tray, Menu, nativeImage, screen, powerMonitor, ipcMain, globalShortcut } = require('electron')
const { execFile, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const isMac = process.platform === 'darwin'
const SHORTCUT = 'CommandOrControl+Alt+Shift+B'
const DEFAULTS = {
  workMin: 25, breakSec: 60, longEvery: 3, longMin: 5, headsUpSec: 15, allowSkip: true,
  blinkMin: 10, postureMin: 30, idleResetMin: 5, pauseForMedia: true, pauseApps: '',
  sound: true, background: 'honey', showTimer: true, openAtLogin: false,
  messages: [
    'Look at something at least 20 feet away.',
    'Close your eyes and take three slow breaths.',
    'Stand up and stretch your arms overhead.',
    'Drop your shoulders and unclench your jaw.',
    'Grab a glass of water.',
  ].join('\n'),
}
const file = path.join(app.getPath('userData'), 'settings.json')
const firstRun = !fs.existsSync(file)
const s = { ...DEFAULTS }
try { Object.assign(s, JSON.parse(fs.readFileSync(file, 'utf8'))) } catch {}

let left = s.workMin * 60 // seconds of screen time until the next break
let breakLeft = 0, breaks = 0, breakStart = 0
let skipStreak = 0 // breaks skipped in a row; a finished break resets it
let pausedUntil = 0 // ms timestamp, Infinity = until resumed
let blocker = '' // app currently delaying breaks (video, call, fullscreen)
let blinkLeft = s.blinkMin * 60, postureLeft = s.postureMin * 60
let tray, headsUp, settingsWin, winWatcher, previewWin
let overlays = []

const preload = path.join(__dirname, 'preload.js')
const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
const lead = () => Math.max(0, s.headsUpSec)
const guilt = () => !skipStreak ? ''
  : skipStreak === 1 ? 'You skipped your last break. Buddy noticed.'
  : skipStreak === 2 ? 'You skipped your last 2 breaks. Your eyes are keeping score.'
  : `${skipStreak} breaks skipped in a row. Buddy is disappointed.`
const skip = () => { skipStreak++; breakLeft ? endBreak(true) : (resetWork(), render()) }
const send = (wins, ch, data) => wins.forEach(w => w && !w.isDestroyed() && w.webContents.send(ch, data))
const kill = w => w && !w.isDestroyed() && w.destroy()
// Fade the break screen out (break.html listens for 'fade'), then close it.
const fadeOut = wins => { send(wins, 'fade'); setTimeout(() => wins.forEach(kill), 400) }

// Tray icon drawn in code: Buddy, a leaning capsule with two oval eyes, 32px @2x.
// Eyes are cut out (template) on macOS and painted `eye` elsewhere.
function buddyIcon(body, eye) {
  const S = 32, buf = Buffer.alloc(S * S * 4)
  const cos = Math.cos(-12 * Math.PI / 180), sin = Math.sin(-12 * Math.PI / 180)
  const oval = (x, y, cx) => ((x - cx) / 5) ** 2 + ((y - 35) / 7.5) ** 2 < 1
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let b = 0, e = 0
    for (let i = 0; i < 16; i++) {
      // sample in the logo's 100-unit space, un-rotated around its centre
      const dx = (x + (i % 4 + 0.5) / 4) * 100 / S - 50, dy = (y + ((i >> 2) + 0.5) / 4) * 100 / S - 50
      const u = 50 + dx * cos - dy * sin, v = 50 + dx * sin + dy * cos
      if (Math.hypot(u - 50, v - Math.min(65, Math.max(35, v))) >= 21) continue
      if (oval(u, v, 43) || oval(u, v, 58)) e++
      else b++
    }
    const o = (y * S + x) * 4, rgb = [0, 1, 2].map(c => (body[c] * b + (eye ? eye[c] * e : 0)) / 16)
    const a = (b + (eye ? e : 0)) / 16 // BGRA, premultiplied
    buf[o] = rgb[2]; buf[o + 1] = rgb[1]; buf[o + 2] = rgb[0]; buf[o + 3] = 255 * a
  }
  return nativeImage.createFromBitmap(buf, { width: S, height: S, scaleFactor: 2 })
}
const icon = isMac ? buddyIcon([0, 0, 0]) : buddyIcon([255, 206, 58], [29, 27, 22])
if (isMac) icon.setTemplateImage(true)

function tick() {
  if (breakLeft > 0) {
    if (--breakLeft === 0) return endBreak(false)
    send(overlays, 'tick', breakLeft)
    return render()
  }
  if (pausedUntil && Date.now() >= pausedUntil) pausedUntil = 0
  if (pausedUntil) return render()

  const idle = powerMonitor.getSystemIdleTime()
  if (s.idleResetMin && idle >= s.idleResetMin * 60) resetWork() // away long enough to count as a break
  if (idle >= 60) return render() // not at the keyboard: hold the timer

  // Breaks never interrupt video, calls or fullscreen apps; hold just before the heads-up instead.
  if (blocker && left <= lead() + 1) { left = lead() + 1; kill(headsUp) }
  else left--
  if (left <= 0) startBreak()
  else if (left <= lead()) { showHeadsUp(); send([headsUp], 'tick', left) }

  const quiet = blocker || left <= lead() || breakLeft
  if (s.blinkMin && --blinkLeft <= 0) { blinkLeft = s.blinkMin * 60; quiet || nudge('blink') }
  if (s.postureMin && --postureLeft <= 0) { postureLeft = s.postureMin * 60; quiet || nudge('posture') }
  render()
}

function resetWork() {
  left = s.workMin * 60
  blinkLeft = s.blinkMin * 60
  postureLeft = s.postureMin * 60
  kill(headsUp)
}

function startBreak(forceLong) {
  kill(headsUp)
  kill(previewWin)
  if (breakLeft) return
  const long = forceLong || (s.longEvery > 0 && (breaks + 1) % s.longEvery === 0)
  breakLeft = long ? s.longMin * 60 : s.breakSec
  breakStart = Date.now()
  const data = breakData({ long, total: breakLeft })
  const primaryId = screen.getPrimaryDisplay().id
  overlays = screen.getAllDisplays().map(d => {
    const w = overlay(d, data, d.id === primaryId)
    w.on('close', e => { // Cmd+W / Alt+F4 = skip
      if (!overlays.includes(w)) return
      e.preventDefault()
      if (s.allowSkip && Date.now() - breakStart >= 5000) skip() // same 5 s lock as the Skip button
    })
    return w
  })
  render()
}

function breakData(extra) {
  const msgs = s.messages.split('\n').map(m => m.trim()).filter(Boolean)
  return JSON.stringify({
    sound: s.sound, allowSkip: s.allowSkip, background: s.background,
    msg: msgs[Math.floor(Math.random() * msgs.length)] || 'Look away from your screen.',
    guilt: guilt(),
    ...extra,
  })
}

function overlay(display, data, primary) {
  const w = new BrowserWindow({
    ...display.bounds, frame: false, transparent: true, show: false, hasShadow: false, skipTaskbar: true,
    resizable: false, movable: false, minimizable: false, maximizable: false, enableLargerThanScreen: true,
    acceptFirstMouse: true, alwaysOnTop: true, webPreferences: { preload },
  })
  w.setBounds(display.bounds) // Windows mis-sizes windows on mixed-DPI monitors until re-set
  w.setAlwaysOnTop(true, 'screen-saver')
  if (isMac) w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
  w.loadFile('break.html', { query: { d: data, primary: primary ? '1' : '' } })
  w.once('ready-to-show', () => {
    w.show()
    if (!primary) return
    if (isMac) app.focus({ steal: true })
    w.focus()
  })
  return w
}

// Break screen on the primary display only; counts down on its own and touches no timers.
function previewBreak() {
  if (breakLeft) return
  kill(previewWin)
  previewWin = overlay(screen.getPrimaryDisplay(), breakData({ preview: true, total: s.breakSec }), true)
}

function endBreak(skipped) {
  if (!overlays.length) return
  const wins = overlays
  overlays = []
  breakLeft = 0
  breaks++
  if (skipped) fadeOut(wins)
  else { skipStreak = 0; send(wins, 'tick', 0); setTimeout(() => fadeOut(wins), 1800) }
  resetWork()
  render()
}

function toast(kind, width, height, msg = '') {
  const wa = screen.getPrimaryDisplay().workArea
  const w = new BrowserWindow({
    x: wa.x + wa.width - width - 8, y: wa.y + 8, width, height, frame: false, transparent: true,
    show: false, hasShadow: false, skipTaskbar: true, resizable: false, alwaysOnTop: true,
    acceptFirstMouse: true, webPreferences: { preload },
  })
  w.setAlwaysOnTop(true, 'screen-saver')
  if (isMac) w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
  w.loadFile('toast.html', { query: { kind, msg, left: String(left), allowSkip: s.allowSkip ? '1' : '' } })
  w.once('ready-to-show', () => w.showInactive()) // never steal focus from the user's work
  return w
}

function showHeadsUp() {
  if (headsUp && !headsUp.isDestroyed()) return
  headsUp = toast('headsup', 376, 134, guilt())
}

function nudge(kind, msg) {
  const w = toast(kind, 316, 104, msg)
  w.setIgnoreMouseEvents(true)
  setTimeout(() => kill(w), 6000)
}

function pause(mins) {
  pausedUntil = mins === Infinity ? Infinity : Date.now() + mins * 60000
  kill(headsUp)
  render()
}

function status() {
  if (breakLeft) return `On break · ${fmt(breakLeft)} left`
  if (pausedUntil === Infinity) return 'Paused'
  if (pausedUntil) return `Paused until ${new Date(pausedUntil).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  if (blocker && left <= lead() + 1) return `Break waiting for ${blocker}`
  if (blocker) return `Next break in ${fmt(left)} · on hold during ${blocker}`
  return `Next break in ${fmt(left)}`
}

function render() {
  tray.setToolTip(`BlinkAway — ${status()}`)
  if (isMac) tray.setTitle(s.showTimer && !pausedUntil ? fmt(breakLeft || left) : '', { fontType: 'monospacedDigit' })
}

function menu() {
  const pauses = [[30, '30 Minutes'], [60, '1 Hour'], [120, '2 Hours'], [Infinity, 'Until I Resume']]
  return Menu.buildFromTemplate([
    { label: status(), enabled: false },
    { type: 'separator' },
    { label: 'Take a Break Now', enabled: !breakLeft, accelerator: SHORTCUT, registerAccelerator: false, click: () => startBreak() },
    { label: 'Take a Long Break', enabled: !breakLeft, click: () => startBreak(true) },
    { label: 'Skip Next Break', enabled: !breakLeft, click: skip },
    pausedUntil
      ? { label: 'Resume', click: () => { pausedUntil = 0; render() } }
      : { label: 'Pause', submenu: pauses.map(([m, label]) => ({ label, click: () => pause(m) })) },
    { type: 'separator' },
    { label: 'Settings…', click: openSettings },
    { label: 'Quit BlinkAway', click: () => app.quit() },
  ])
}

function openSettings() {
  if (settingsWin) return settingsWin.show(), settingsWin.focus()
  settingsWin = new BrowserWindow({
    width: 780, height: 580, minWidth: 660, minHeight: 440, show: false, title: 'BlinkAway',
    icon, backgroundColor: '#00000000', webPreferences: { preload },
  })
  settingsWin.removeMenu()
  settingsWin.loadFile('settings.html')
  settingsWin.once('ready-to-show', () => {
    settingsWin.show()
    if (isMac) app.focus({ steal: true })
  })
  settingsWin.on('closed', () => { settingsWin = null })
}

// Smart pause. macOS: apps holding a display-sleep assertion (video playback, calls, presentations).
// Windows: the shell's "busy" state (fullscreen apps, games, presentation mode).
const KEEP_AWAKE = /caffeinate|amphetamine|keepingyouawake|lungo|theine/i
let winBusy = false
function sh(cmd, args) {
  return new Promise(r => execFile(cmd, args, { windowsHide: true }, (err, out) => r(err ? '' : out)))
}
async function findBlocker() {
  if (s.pauseForMedia && isMac) {
    const out = await sh('pmset', ['-g', 'assertions'])
    // Video and Zoom-style apps keep the display awake; browser and Electron calls (Meet, Slack, Teams)
    // hold Chromium's "WebRTC has active PeerConnections" assertion instead.
    for (const [, name, what] of out.matchAll(/pid \d+\(([^)]+)\):.*(PreventUserIdleDisplaySleep|NoDisplaySleepAssertion|named: "WebRTC)/g))
      if (!KEEP_AWAKE.test(name)) return what.startsWith('named') ? `a call in ${name}` : name
  }
  if (s.pauseForMedia && winBusy) return 'a fullscreen app'
  const wanted = s.pauseApps.split(',').map(a => a.trim().toLowerCase().replace(/\.exe$/, '')).filter(Boolean)
  if (!wanted.length) return ''
  const out = isMac ? await sh('ps', ['-Aco', 'comm']) : await sh('tasklist', ['/fo', 'csv', '/nh'])
  const running = new Set(out.split(/\r?\n/).map(l => l.split('","')[0].replace(/"/g, '').trim().toLowerCase().replace(/\.exe$/, '')))
  return wanted.find(a => running.has(a)) || ''
}
// Tell the user when breaks go on hold for a call/video and when they're back on.
let clearPolls = 0
async function watchBlocker() {
  const next = await findBlocker()
  if (next) clearPolls = 0
  else if (blocker && ++clearPolls < 2) return // one missed poll isn't the end of a call
  if (!!next !== !!blocker && !breakLeft && !pausedUntil) {
    if (next) nudge('hold', `Waiting for ${next}. We won't interrupt you.`)
    else if (left > lead() + 1) nudge('resume', `Next break in ${fmt(left)}.`) // else the heads-up says it
  }
  blocker = next
  render()
}

function watchWindowsFullscreen() {
  // One long-lived PowerShell polling SHQueryUserNotificationState: 2 busy, 3 D3D fullscreen, 4 presentation.
  const script = `$ErrorActionPreference='Stop'
Add-Type -Name N -Namespace W -MemberDefinition '[DllImport("shell32.dll")] public static extern int SHQueryUserNotificationState(out int s);'
while ($true) { $s = 0; [void][W.N]::SHQueryUserNotificationState([ref]$s); [Console]::Out.WriteLine($s); [Console]::Out.Flush(); Start-Sleep 4 }`
  winWatcher = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true })
  winWatcher.stdout.on('data', d => { winBusy = [2, 3, 4].includes(+String(d).trim().split(/\s+/).pop()) })
  winWatcher.on('error', () => {})
}

ipcMain.handle('get-settings', () => s)
ipcMain.handle('about', () => ({ version: app.getVersion(), file }))
ipcMain.on('settings', (_, next) => {
  for (const k in DEFAULTS) if (typeof next[k] === typeof DEFAULTS[k]) s[k] = next[k]
  s.workMin = Math.max(1, s.workMin || 0)
  s.breakSec = Math.max(5, s.breakSec || 0)
  s.longMin = Math.max(1, s.longMin || 0)
  fs.writeFileSync(file, JSON.stringify(s, null, 2))
  left = Math.min(left, s.workMin * 60)
  blinkLeft = s.blinkMin * 60
  postureLeft = s.postureMin * 60
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: s.openAtLogin })
  render()
})
ipcMain.on('action', (_, { type, mins }) => {
  if (type === 'start') startBreak()
  if (type === 'preview') previewBreak()
  if (type === 'close-preview') fadeOut([previewWin])
  if (type === 'skip' && (s.allowSkip || !breakLeft)) skip()
  if (type === 'snooze' && breakLeft) { // postpone a running break; it doesn't count toward long breaks
    if (!s.allowSkip) return
    endBreak(true)
    breaks--
    left = mins * 60
  } else if (type === 'snooze') { left += mins * 60; kill(headsUp) }
  render()
})

if (!app.requestSingleInstanceLock()) app.quit()
else app.whenReady().then(() => {
  if (isMac) app.dock.hide()
  tray = new Tray(icon)
  const popUp = () => tray.popUpContextMenu(menu())
  tray.on('click', popUp)
  tray.on('right-click', popUp)
  globalShortcut.register(SHORTCUT, () => startBreak())
  powerMonitor.on('resume', () => { resetWork(); render() }) // slept = rested
  if (process.platform === 'win32') watchWindowsFullscreen()
  setInterval(tick, 1000)
  setInterval(watchBlocker, 5000)
  render()
  if (firstRun) { fs.writeFileSync(file, JSON.stringify(s, null, 2)); openSettings() }
})

app.on('second-instance', openSettings)
app.on('window-all-closed', () => {}) // live in the tray
app.on('before-quit', () => endBreak(true))
app.on('will-quit', () => { globalShortcut.unregisterAll(); winWatcher?.kill() })
