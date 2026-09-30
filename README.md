# BlinkAway

A tray/menu-bar break reminder for macOS and Windows, Inspired by LookAway.

- Timed eye breaks (default: 20 s every 20 min), with a long break every few breaks
- Heads-up before each break: start now, +1/+5 min, or skip
- Fullscreen break screen on every display, with a breathing animation, messages, gradients or your own image, and chimes
- Blink and posture nudges that never take focus
- Smart pause: time away from the keyboard counts as a break, and breaks wait until you're done with video/calls (macOS) or fullscreen apps (Windows), or while chosen apps are running
- Pause for 30 min / 1 h / 2 h / until resumed, skip next break, global shortcut `⌘⌥⇧B` / `Ctrl+Alt+Shift+B`
- Run a shell command when a break starts or ends
- Open at login

## Run

    npm install
    npm start

## Build installers

    npm run dist

Builds a `.dmg` on macOS and an NSIS `.exe` installer on Windows (run it on each OS; `npx electron-builder --win` also works from a Mac).
