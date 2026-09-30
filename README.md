# BlinkAway

A tray/menu-bar break reminder for macOS and Windows, Inspired by LookAway.

- Timed eye breaks (default: 60 s every 25 min), with a long break every few breaks
- Heads-up before each break: start now, +1/+5 min, or skip
- Fullscreen break screen on every display, with Buddy, messages, background themes and chimes; postpone it by 1 or 5 min
- Blink and posture nudges that never take focus
- Smart pause: time away from the keyboard counts as a break, and breaks wait until you're done with video or calls, including Meet and other browser calls (macOS), with a toast when they go on hold and resume or fullscreen apps (Windows), or while chosen apps are running
- Pause for 30 min / 1 h / 2 h / until resumed, skip next break, global shortcut `⌘⌥⇧B` / `Ctrl+Alt+Shift+B`
- Open at login

## Run

    npm install
    npm start

## Build installers

    npm run dist

Builds a `.dmg` on macOS and an NSIS `.exe` installer on Windows (run it on each OS; `npx electron-builder --win` also works from a Mac).
