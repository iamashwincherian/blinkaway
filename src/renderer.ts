/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}
const ipcRenderer = window.ipcRenderer;

console.log('👋 This message is being logged by "renderer.ts", included via Vite');

function showBreakOverlay() {
  document.body.innerHTML = `
    <div id="break-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#222;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;">
      <h1>Blink your eyes and take rest</h1>
      <div style="font-size:3rem;margin:1rem 0;" id="break-timer">2:00</div>
      <button id="skip-break" style="font-size:1.5rem;padding:0.5rem 2rem;">Skip Break</button>
    </div>
  `;
  document.getElementById('skip-break')?.addEventListener('click', () => {
    ipcRenderer.send('skip-break');
  });
}

function updateBreakTimer(seconds: number) {
  const el = document.getElementById('break-timer');
  if (el) {
    const min = Math.floor(seconds / 60);
    const sec = (seconds % 60).toString().padStart(2, '0');
    el.textContent = `${min}:${sec}`;
  }
}

if (window.location.hash === '#break') {
  showBreakOverlay();
  ipcRenderer.on('break-timer', (seconds: number) => {
    updateBreakTimer(seconds);
  });
}
