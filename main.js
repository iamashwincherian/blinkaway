const { app, BrowserWindow, Tray, Menu, nativeImage, screen, powerMonitor, ipcMain, globalShortcut } = require('electron')
const { execFile, exec, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const isMac = process.platform === 'darwin'
const SHORTCUT = 'CommandOrControl+Alt+Shift+B'
const DEFAULTS = {
  workMin: 20, breakSec: 20, longEvery: 3, longMin: 5, headsUpSec: 15, allowSkip: true,
  blinkMin: 10, postureMin: 30, idleResetMin: 5, pauseForMedia: true, pauseApps: '',
  sound: true, background: 'dusk', bgImage: '', showTimer: true, openAtLogin: false,
  messages: [
    'Look at something at least 20 feet away.',
    'Close your eyes and take three slow breaths.',
    'Stand up and stretch your arms overhead.',
    'Drop your shoulders and unclench your jaw.',
    'Grab a glass of water.',
  ].join('\n'),
  onStart: '', onEnd: '',
}
const file = path.join(app.getPath('userData'), 'settings.json')
const firstRun = !fs.existsSync(file)
const s = { ...DEFAULTS }
try { Object.assign(s, JSON.parse(fs.readFileSync(file, 'utf8'))) } catch {}

let left = s.workMin * 60 // seconds of screen time until the next break
let breakLeft = 0, breaks = 0
let pausedUntil = 0 // ms timestamp, Infinity = until resumed
let blocker = '' // app currently delaying breaks (video, call, fullscreen)
let blinkLeft = s.blinkMin * 60, postureLeft = s.postureMin * 60
let tray, headsUp, settingsWin, winWatcher
let overlays = []

const preload = path.join(__dirname, 'preload.js')
const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
const lead = () => Math.max(0, s.headsUpSec)
const send = (wins, ch, data) => wins.forEach(w => w && !w.isDestroyed() && w.webContents.send(ch, data))
const kill = w => w && !w.isDestroyed() && w.destroy()
const run = cmd => cmd && exec(cmd, { windowsHide: true }, () => {})

// Tray icon drawn in code: an almond eye outline with a pupil, 32px @2x.
function eyeIcon(rgb) {
  const S = 32, buf = Buffer.alloc(S * S * 4)
  const lens = (x, y, r) => Math.hypot(x - 16, y - 3) < r && Math.hypot(x - 16, y - 29) < r
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let a = 0
    for (let i = 0; i < 16; i++) {
      const px = x + (i % 4 + 0.5) / 4, py = y + ((i >> 2) + 0.5) / 4
      if ((lens(px, py, 20) && !lens(px, py, 17.6)) || Math.hypot(px - 16, py - 16) < 4.5) a++
    }
    a /= 16
    const o = (y * S + x) * 4 // BGRA, premultiplied
    buf[o] = rgb[2] * a; buf[o + 1] = rgb[1] * a; buf[o + 2] = rgb[0] * a; buf[o + 3] = 255 * a
  }
  return nativeImage.createFromBitmap(buf, { width: S, height: S, scaleFactor: 2 })
}
const icon = eyeIcon(isMac ? [0, 0, 0] : [124, 92, 255])
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
  if (breakLeft) return
  const long = forceLong || (s.longEvery > 0 && (breaks + 1) % s.longEvery === 0)
  breakLeft = long ? s.longMin * 60 : s.breakSec
  const msgs = s.messages.split('\n').map(m => m.trim()).filter(Boolean)
  const bg = s.bgImage.trim()
  const data = JSON.stringify({
    long, total: breakLeft, sound: s.sound, allowSkip: s.allowSkip, background: s.background,
    bgUrl: bg && (/^(https?|file):/.test(bg) ? bg : pathToFileURL(bg).href),
    msg: msgs[Math.floor(Math.random() * msgs.length)] || 'Look away from your screen.',
  })
  const primaryId = screen.getPrimaryDisplay().id
  overlays = screen.getAllDisplays().map(d => {
    const primary = d.id === primaryId
    const w = new BrowserWindow({
      ...d.bounds, frame: false, transparent: true, show: false, hasShadow: false, skipTaskbar: true,
      resizable: false, movable: false, minimizable: false, maximizable: false, enableLargerThanScreen: true,
      acceptFirstMouse: true, alwaysOnTop: true, webPreferences: { preload },
    })
    w.setBounds(d.bounds) // Windows mis-sizes windows on mixed-DPI monitors until re-set
    w.setAlwaysOnTop(true, 'screen-saver')
    if (isMac) w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
    w.loadFile('break.html', { query: { d: data, primary: primary ? '1' : '' } })
    w.once('ready-to-show', () => {
      w.show()
      if (!primary) return
      if (isMac) app.focus({ steal: true })
      w.focus()
    })
    w.on('close', e => { // Cmd+W / Alt+F4 = skip
      if (!overlays.includes(w)) return
      e.preventDefault()
      if (s.allowSkip) endBreak(true)
    })
    return w
  })
  run(s.onStart)
  render()
}

function endBreak(skipped) {
  if (!overlays.length) return
  const wins = overlays
  overlays = []
  breakLeft = 0
  breaks++
  if (skipped) wins.forEach(kill)
  else { send(wins, 'tick', 0); setTimeout(() => wins.forEach(kill), 1800) }
  resetWork()
  run(s.onEnd)
  render()
}

function toast(kind, width, height) {
  const wa = screen.getPrimaryDisplay().workArea
  const w = new BrowserWindow({
    x: wa.x + wa.width - width - 8, y: wa.y + 8, width, height, frame: false, transparent: true,
    show: false, hasShadow: false, skipTaskbar: true, resizable: false, alwaysOnTop: true,
    acceptFirstMouse: true, webPreferences: { preload },
  })
  w.setAlwaysOnTop(true, 'screen-saver')
  if (isMac) w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
  w.loadFile('toast.html', { query: { kind, left: String(left), allowSkip: s.allowSkip ? '1' : '' } })
  w.once('ready-to-show', () => w.showInactive()) // never steal focus from the user's work
  return w
}

function showHeadsUp() {
  if (headsUp && !headsUp.isDestroyed()) return
  headsUp = toast('headsup', 376, 134)
}

function nudge(kind) {
  const w = toast(kind, 316, 104)
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
    { label: 'Skip Next Break', enabled: !breakLeft, click: () => { resetWork(); render() } },
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
    width: 560, height: 780, minWidth: 460, show: false, title: 'BlinkAway',
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
    for (const [, name] of out.matchAll(/pid \d+\(([^)]+)\):.*(?:PreventUserIdleDisplaySleep|NoDisplaySleepAssertion)/g))
      if (!KEEP_AWAKE.test(name)) return name
  }
  if (s.pauseForMedia && winBusy) return 'a fullscreen app'
  const wanted = s.pauseApps.split(',').map(a => a.trim().toLowerCase().replace(/\.exe$/, '')).filter(Boolean)
  if (!wanted.length) return ''
  const out = isMac ? await sh('ps', ['-Aco', 'comm']) : await sh('tasklist', ['/fo', 'csv', '/nh'])
  const running = new Set(out.split(/\r?\n/).map(l => l.split('","')[0].replace(/"/g, '').trim().toLowerCase().replace(/\.exe$/, '')))
  return wanted.find(a => running.has(a)) || ''
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
  if (type === 'skip') breakLeft ? s.allowSkip && endBreak(true) : resetWork()
  if (type === 'snooze') { left += mins * 60; kill(headsUp) }
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
  setInterval(async () => { blocker = await findBlocker() }, 5000)
  render()
  if (firstRun) { fs.writeFileSync(file, JSON.stringify(s, null, 2)); openSettings() }
})

app.on('second-instance', openSettings)
app.on('window-all-closed', () => {}) // live in the tray
app.on('before-quit', () => endBreak(true))
app.on('will-quit', () => { globalShortcut.unregisterAll(); winWatcher?.kill() })
