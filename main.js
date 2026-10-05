const { app, BrowserWindow, Tray, Menu, nativeImage, screen, powerMonitor, ipcMain, globalShortcut } = require('electron')
const { execFile, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const isMac = process.platform === 'darwin'
const SHORTCUT = 'CommandOrControl+Alt+Shift+B'
const DEFAULTS = {
  workMin: 25, breakSec: 60, longEvery: 3, longMin: 5, headsUpSec: 15, allowSkip: true,
  blinkMin: 10, postureMin: 30, idleResetMin: 5, pauseForMedia: true, pauseApps: '',
  sound: true, background: 'honey', showTimer: true, openAtLogin: false, exercises: true,
  planned: [], // fixed-time breaks: [{ time: '12:30', min: 30, label: 'Lunch' }]
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

// Break history: per-day counts, streaks, and which hours breaks get skipped. Drives the ghost's mood and the report.
const statsFile = path.join(app.getPath('userData'), 'stats.json')
const stats = { days: {}, skipHours: Array(24).fill(0), streak: 0, best: 0, skipStreak: 0 }
try { Object.assign(stats, JSON.parse(fs.readFileSync(statsFile, 'utf8'))) } catch {}
const pad = n => String(n).padStart(2, '0')
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
function record(kind) { // 'taken' | 'skipped' | 'postponed'
  const day = stats.days[dayKey()] ??= { taken: 0, skipped: 0, postponed: 0 }
  day[kind]++
  if (kind === 'taken') { stats.streak++; stats.best = Math.max(stats.best, stats.streak); stats.skipStreak = 0 }
  if (kind === 'skipped') { stats.streak = 0; stats.skipStreak++; stats.skipHours[new Date().getHours()]++ }
  for (const k of Object.keys(stats.days).sort().slice(0, -60)) delete stats.days[k] // keep ~2 months
  fs.writeFileSync(statsFile, JSON.stringify(stats))
  tray?.setImage(trayIcon())
}
const mood = () => stats.skipStreak >= 3 ? 'sad' : stats.skipStreak ? 'tired' : stats.streak >= 5 ? 'happy' : 'calm'

let left = s.workMin * 60 // seconds of screen time until the next break
let breakLeft = 0, breaks = 0, breakStart = 0
let currentPlanned = null, snoozedPlanned = null // fixed-time break on screen / pushed back with +1/+5
const plannedDone = {} // 'YYYY-MM-DD HH:MM' → handled today
const EXERCISES = ['follow', 'blink', 'palm', 'far']
let exercise = Math.floor(Math.random() * EXERCISES.length) // rotates so the same one never repeats back to back
let pausedUntil = 0 // ms timestamp, Infinity = until resumed
let blocker = '' // app currently delaying breaks (video, call, fullscreen)
let blinkLeft = s.blinkMin * 60, postureLeft = s.postureMin * 60
let tray, headsUp, settingsWin, winWatcher, previewWin
let overlays = []

const preload = path.join(__dirname, 'preload.js')
const fmt = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
const lead = () => Math.max(0, s.headsUpSec)
// One line about your habits: guilt after skips, praise after a streak.
const moodLine = () => {
  const n = stats.skipStreak
  if (n === 1) return 'You skipped your last break. Your eyes noticed.'
  if (n === 2) return 'You skipped your last 2 breaks. Your eyes are keeping score.'
  if (n > 2) return `${n} breaks skipped in a row. Your eyes deserve better.`
  return stats.streak >= 5 ? `${stats.streak} breaks in a row. Your eyes are thriving.` : ''
}
const skip = () => { record('skipped'); breakLeft ? endBreak(true) : (resetWork(), render()) }
const send = (wins, ch, data) => wins.forEach(w => w && !w.isDestroyed() && w.webContents.send(ch, data))
const kill = w => w && !w.isDestroyed() && w.destroy()
// Fade the break screen out (break.html listens for 'fade'), then close it.
const fadeOut = wins => { send(wins, 'fade'); setTimeout(() => wins.forEach(kill), 400) }

// Tray icon drawn in code: the ghost, a leaning capsule with two oval eyes, 32px @2x.
// Eyes are cut out (template) on macOS and painted `eye` elsewhere; their shape follows the ghost's mood.
const TRAY_EYES = { calm: [35, 7.5], happy: [35, 7.5], tired: [38, 3.2], sad: [41, 5.5] } // [centre y, half-height]
function ghostIcon(body, eye, feel = 'calm') {
  const S = 32, buf = Buffer.alloc(S * S * 4), [ey, eh] = TRAY_EYES[feel]
  const cos = Math.cos(-12 * Math.PI / 180), sin = Math.sin(-12 * Math.PI / 180)
  const oval = (x, y, cx) => ((x - cx) / 5) ** 2 + ((y - ey) / eh) ** 2 < 1
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
function trayIcon() {
  const img = isMac ? ghostIcon([0, 0, 0], null, mood()) : ghostIcon([255, 206, 58], [29, 27, 22], mood())
  if (isMac) img.setTemplateImage(true)
  return img
}
const icon = trayIcon()

function tick() {
  if (breakLeft > 0) {
    if (--breakLeft === 0) return endBreak(false)
    send(overlays, 'tick', breakLeft)
    return render()
  }
  if (pausedUntil && Date.now() >= pausedUntil) pausedUntil = 0
  if (pausedUntil) return render()

  const idle = powerMonitor.getSystemIdleTime()
  // Fixed-time breaks: already away = that's the break; in a call = wait until it ends.
  const due = duePlanned()
  if (due && idle >= 60) plannedDone[due.key] = true
  else if (due && !blocker) return startBreak(false, due)

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

// The fixed-time break that's due now, if any. Gives up once it's an hour late.
function duePlanned() {
  if (snoozedPlanned && Date.now() >= snoozedPlanned.at) return snoozedPlanned
  const now = new Date()
  for (const p of s.planned) {
    const [h, m] = p.time.split(':').map(Number), at = new Date(now).setHours(h, m, 0, 0)
    const key = `${dayKey(now)} ${p.time}`
    if (now >= at && now - at < 3600000 && !plannedDone[key]) return { ...p, key }
  }
}

function startBreak(forceLong, planned) {
  kill(headsUp)
  kill(previewWin)
  if (breakLeft) return
  if (planned) { plannedDone[planned.key] = true; if (planned === snoozedPlanned) snoozedPlanned = null }
  currentPlanned = planned || null
  const long = !planned && (forceLong || (s.longEvery > 0 && (breaks + 1) % s.longEvery === 0))
  breakLeft = planned ? planned.min * 60 : long ? s.longMin * 60 : s.breakSec
  breakStart = Date.now()
  const data = breakData(planned
    ? { total: breakLeft, planned: planned.label || 'Scheduled break', msg: `Time to step away for ${planned.min} minutes.` }
    : { long, total: breakLeft, exercise: !long && s.exercises ? nextExercise() : '' })
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
    guilt: moodLine(), mood: mood(),
    ...extra,
  })
}
const nextExercise = () => EXERCISES[exercise++ % EXERCISES.length]

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
  const data = breakData({ preview: true, total: s.breakSec, exercise: s.exercises ? nextExercise() : '' })
  previewWin = overlay(screen.getPrimaryDisplay(), data, true)
}

function endBreak(skipped) {
  if (!overlays.length) return
  const wins = overlays
  overlays = []
  breakLeft = 0
  if (!currentPlanned) breaks++ // fixed-time breaks don't advance the long-break cycle
  currentPlanned = null
  if (skipped) fadeOut(wins)
  else { record('taken'); send(wins, 'tick', 0); setTimeout(() => fadeOut(wins), 1800) }
  resetWork()
  render()
}

function toast(kind, width, height, msg = '') {
  const wa = screen.getPrimaryDisplay().workArea
  const w = new BrowserWindow({
    x: wa.x + wa.width - width - 4, y: wa.y + 4, // 12px of the window is shadow room, so the card sits 16px in width, height, frame: false, transparent: true,
    show: false, hasShadow: false, skipTaskbar: true, resizable: false, alwaysOnTop: true,
    acceptFirstMouse: true, webPreferences: { preload },
  })
  w.setAlwaysOnTop(true, 'screen-saver')
  if (isMac) w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true })
  w.loadFile('toast.html', { query: { kind, msg, mood: mood(), left: String(left), allowSkip: s.allowSkip ? '1' : '' } })
  w.once('ready-to-show', () => w.showInactive()) // never steal focus from the user's work
  return w
}

function showHeadsUp() {
  if (headsUp && !headsUp.isDestroyed()) return
  headsUp = toast('headsup', 384, 142, moodLine())
}

function nudge(kind, msg) {
  const w = toast(kind, 324, 112, msg)
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
    { label: 'Your Report…', click: () => openSettings('report') },
    { label: 'Settings…', click: () => openSettings() },
    { label: 'Quit BlinkAway', click: () => app.quit() },
  ])
}

function openSettings(tab = 'general') {
  if (settingsWin) return settingsWin.webContents.send('tab', tab), settingsWin.show(), settingsWin.focus()
  settingsWin = new BrowserWindow({
    width: 780, height: 580, minWidth: 660, minHeight: 440, show: false, title: 'BlinkAway',
    icon, backgroundColor: '#00000000', webPreferences: { preload },
    ...(isMac && { titleBarStyle: 'hiddenInset', vibrancy: 'sidebar', visualEffectState: 'followWindow' }),
  })
  settingsWin.removeMenu()
  settingsWin.loadFile('settings.html', { hash: tab })
  settingsWin.once('ready-to-show', () => {
    settingsWin.show()
    if (isMac) app.focus({ steal: true })
  })
  settingsWin.on('closed', () => { settingsWin = null })
}

// Smart pause. macOS: any app using a microphone (calls in any app or browser), Chromium WebRTC calls,
// and apps holding a display-sleep assertion (video, presentations).
// Windows: an app using the microphone, or the shell's "busy" state (fullscreen apps, games, presentations).
const KEEP_AWAKE = /caffeinate|amphetamine|keepingyouawake|lungo|theine/i
const MIC_SYSTEM = /^(corespeechd|siri|assistantd|heard|coreaudiod|audiomxd|com\.apple\.)/i // always-listening OS bits
let winBusy = false, winMic = ''
function sh(cmd, args) {
  return new Promise(r => execFile(cmd, args, { windowsHide: true }, (err, out) => r(err ? '' : out)))
}
// "Google Chrome" for .../Google Chrome.app/.../Google Chrome Helper.app/.../Google Chrome Helper
async function macAppName(pid) {
  const exe = (await sh('ps', ['-p', pid, '-o', 'comm='])).trim()
  return exe.match(/\/([^/]+)\.app\//)?.[1] || path.basename(exe)
}
async function findBlocker() {
  if (s.pauseForMedia && isMac) {
    const out = await sh('pmset', ['-g', 'assertions'])
    // coreaudiod holds an assertion per client while a device runs; "audio-in" = that client is recording.
    for (const [, pid] of out.matchAll(/Created for PID: (\d+)\.?\s*\n\s*Resources:[^\n]*audio-in/g)) {
      const name = await macAppName(pid)
      if (name && !MIC_SYSTEM.test(name)) return `a call in ${name}`
    }
    // Video and Zoom-style apps keep the display awake; browser and Electron calls (Meet, Slack, Teams)
    // hold Chromium's "WebRTC has active PeerConnections" assertion even with the mic muted.
    for (const [, name, what] of out.matchAll(/pid \d+\(([^)]+)\):.*(PreventUserIdleDisplaySleep|NoDisplaySleepAssertion|named: "WebRTC)/g))
      if (!KEEP_AWAKE.test(name)) return what.startsWith('named') ? `a call in ${name}` : name
  }
  if (s.pauseForMedia && winMic) return `a call in ${winMic}`
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

// Lock the computer; the break keeps counting underneath. macOS uses the bundled build/lock helper
// (SACLockScreenImmediate, no permissions needed), falling back to sleeping the display.
function lockScreen() {
  if (!isMac) return execFile('rundll32.exe', ['user32.dll,LockWorkStation'])
  const helper = app.isPackaged ? path.join(process.resourcesPath, 'lock') : path.join(__dirname, 'build', 'lock')
  execFile(helper, err => err && execFile('pmset', ['displaysleepnow']))
}

function watchWindows() {
  // One long-lived PowerShell printing "<state>|<mic app>" every 4 s.
  // state: SHQueryUserNotificationState, 2 busy, 3 D3D fullscreen, 4 presentation.
  // mic app: Windows' privacy store keeps LastUsedTimeStop = 0 on the key of whichever app is using the mic,
  // e.g. "C:#Program Files#Google#Chrome#Application#chrome.exe" or "MSTeams_8wekyb3d8bbwe".
  const script = `Add-Type -Name N -Namespace W -MemberDefinition '[DllImport("shell32.dll")] public static extern int SHQueryUserNotificationState(out int s);'
$mic = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone'
while ($true) {
  $s = 0; [void][W.N]::SHQueryUserNotificationState([ref]$s)
  $app = Get-ChildItem $mic -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.GetValue('LastUsedTimeStop') -eq 0 -and $_.GetValue('LastUsedTimeStart') -gt 0 } |
    Select-Object -First 1 -ExpandProperty PSChildName
  [Console]::Out.WriteLine("$s|$app"); [Console]::Out.Flush(); Start-Sleep 4
}`
  winWatcher = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true })
  winWatcher.stdout.on('data', d => {
    const [state, app = ''] = String(d).trim().split(/\r?\n/).pop().split('|')
    winBusy = [2, 3, 4].includes(+state)
    const name = app.split('#').pop().split('_')[0].replace(/\.exe$/i, '')
    winMic = name && name[0].toUpperCase() + name.slice(1)
  })
  winWatcher.on('error', () => {})
}

ipcMain.handle('get-settings', () => s)
ipcMain.handle('about', () => ({ version: app.getVersion(), file }))
ipcMain.handle('stats', () => ({ ...stats, mood: mood(), line: moodLine() }))
ipcMain.on('settings', (_, next) => {
  for (const k in DEFAULTS) if (typeof next[k] === typeof DEFAULTS[k]) s[k] = next[k]
  s.planned = (Array.isArray(s.planned) ? s.planned : [])
    .filter(p => /^\d\d:\d\d$/.test(p?.time))
    .map(p => ({ time: p.time, min: Math.min(240, Math.max(1, Math.round(+p.min) || 15)), label: String(p.label || '').slice(0, 40) }))
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
  if (type === 'lock') lockScreen()
  if (type === 'close-preview') fadeOut([previewWin])
  if (type === 'skip' && (s.allowSkip || !breakLeft)) skip()
  if (type === 'snooze' && breakLeft) { // postpone a running break; it doesn't count toward long breaks
    if (!s.allowSkip) return
    const planned = currentPlanned
    if (planned) snoozedPlanned = { ...planned, at: Date.now() + mins * 60000 }
    else breaks-- // offsets endBreak's count
    endBreak(true)
    if (!planned) left = mins * 60
    record('postponed')
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
  if (process.platform === 'win32') watchWindows()
  setInterval(tick, 1000)
  setInterval(watchBlocker, 5000)
  render()
  if (firstRun) { fs.writeFileSync(file, JSON.stringify(s, null, 2)); openSettings() }
})

app.on('second-instance', () => openSettings())
app.on('window-all-closed', () => {}) // live in the tray
app.on('before-quit', () => endBreak(true))
app.on('will-quit', () => { globalShortcut.unregisterAll(); winWatcher?.kill() })
