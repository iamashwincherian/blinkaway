// node build/make-lock.js — compiles build/lock (macOS only; bundled as an extra resource by electron-builder)
if (process.platform !== 'darwin') process.exit(0)
const { execFileSync } = require('child_process')
execFileSync('clang', ['-O2', '-o', `${__dirname}/lock`, `${__dirname}/lock.c`], { stdio: 'inherit' })
