// npm test: runs the real main.js against a stub Electron and drives its timers by hand.
const Module = require('module'), fs = require('fs'), os = require('os'), path = require('path'), assert = require('assert')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ba-'))
const now = new Date(); const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
fs.writeFileSync(path.join(tmp, 'settings.json'), JSON.stringify({ planned: [{ time: hhmm, min: 2, label: 'Lunch' }], workMin: 25, longEvery: 0 }))

const handlers = {}, wins = [], intervals = []
class BW {
  constructor(o) { this.o = o; this.destroyed = false; wins.push(this); this.webContents = { send: (ch, d) => (this.sent ||= []).push([ch, d]) } }
  loadFile(f, o) { this.file = f; this.query = o?.query }
  setBounds() {} setAlwaysOnTop() {} setVisibleOnAllWorkspaces() {} once() {} on() {} showInactive() {} setIgnoreMouseEvents() {} removeMenu() {} show() {} focus() {}
  isDestroyed() { return this.destroyed } destroy() { this.destroyed = true }
}
const electron = {
  app: { getPath: () => tmp, requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(), on() {}, dock: { hide() {} }, focus() {}, isPackaged: false, getVersion: () => '1.0.0', setLoginItemSettings() {}, quit() {} },
  BrowserWindow: BW, Tray: class { setToolTip() {} setTitle() {} on() {} setImage(i) { this.img = i } popUpContextMenu() {} },
  Menu: { buildFromTemplate: t => t }, nativeImage: { createFromBitmap: () => ({ setTemplateImage() {} }) },
  screen: { getPrimaryDisplay: () => ({ id: 1, bounds: {}, workArea: { x: 0, y: 0, width: 1000, height: 800 } }), getAllDisplays: () => [{ id: 1, bounds: {} }] },
  powerMonitor: { getSystemIdleTime: () => 0, on() {} },
  ipcMain: { handle: (c, f) => (handlers[c] = f), on: (c, f) => (handlers[c] = f) },
  globalShortcut: { register() {}, unregisterAll() {} },
}
const load = Module._load
Module._load = (req, ...a) => req === 'electron' ? electron : load(req, ...a)
global.setInterval = (fn, ms) => intervals.push([fn, ms])
require(path.join(__dirname, '..', 'main.js'))

setImmediate(async () => {
  const tick = intervals.find(([, ms]) => ms === 1000)[0]
  const breakWin = () => wins.filter(w => w.file === 'break.html' && !w.destroyed && !(w.sent || []).some(([c]) => c === 'fade')).at(-1)
  const data = () => JSON.parse(breakWin().query.d)

  tick() // planned break is due right now
  assert.strictEqual(data().planned, 'Lunch'); assert.strictEqual(data().total, 120)
  console.log('✓ fixed-time break starts on time, 2 min, labelled Lunch')

  handlers.action(null, { type: 'snooze', mins: 5 }) // postpone the planned break
  assert(!breakWin(), 'break closed')
  tick(); assert(!breakWin(), 'not straight back')
  const realNow = Date.now; Date.now = () => realNow() + 5 * 60000 + 1000
  tick(); assert.strictEqual(data().planned, 'Lunch'); Date.now = realNow
  console.log('✓ +5 min on a fixed-time break brings it back 5 min later, not twice in a row')

  handlers.action(null, { type: 'skip' }) // skip needs no unlock from the main side
  let st = await handlers.stats()
  assert.strictEqual(st.skipStreak, 1); assert.strictEqual(st.mood, 'tired'); assert.match(st.line, /skipped your last break/)
  tick(); assert(!breakWin(), 'a skipped fixed-time break is done for today')
  console.log('✓ skip → streak 1, ghost tired, planned break not repeated')

  for (let i = 0; i < 2; i++) { handlers.action(null, { type: 'start' }); handlers.action(null, { type: 'skip' }) }
  st = await handlers.stats(); assert.strictEqual(st.mood, 'sad'); assert.strictEqual(st.skipStreak, 3)
  console.log('✓ 3 skips in a row → ghost sad')

  for (let i = 0; i < 5; i++) { handlers.action(null, { type: 'start' }); const w = breakWin(); const n = data().total; for (let t = 0; t < n; t++) tick() }
  st = await handlers.stats()
  assert.strictEqual(st.skipStreak, 0); assert.strictEqual(st.streak, 5); assert.strictEqual(st.mood, 'happy'); assert.match(st.line, /thriving/)
  const today = Object.values(st.days)[0]
  assert.deepStrictEqual([today.taken, today.skipped, today.postponed], [5, 3, 1])
  console.log('✓ 5 finished breaks → streak 5, ghost happy; today = 5 taken, 3 skipped, 1 postponed')

  const kinds = new Set(); for (let i = 0; i < 5; i++) { handlers.action(null, { type: 'start' }); kinds.add(data().exercise); handlers.action(null, { type: 'skip' }) }
  assert.strictEqual(kinds.size, 5)
  console.log('✓ exercises rotate through all 5 without repeats:', [...kinds].join(', '))

  assert(JSON.parse(fs.readFileSync(path.join(tmp, 'stats.json'))).best >= 5)
  console.log('✓ stats persisted to stats.json')
  process.exit(0)
})
