import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let tray: Tray | null = null;
let workTimer: NodeJS.Timeout | null = null;
let workTimeLeft = 25 * 60; // 25 minutes in seconds
const WORK_DURATION = 10; // 10 seconds for quick testing
const BREAK_DURATION = 2 * 60; // 2 minutes
let isOnBreak = false;
let breakTimer: NodeJS.Timeout | null = null;
let breakTimeLeft = BREAK_DURATION;
let breakWindow: BrowserWindow | null = null;
let isPaused = false;

function updateTrayTooltip() {
  if (!tray) return;
  if (isOnBreak) {
    tray.setToolTip(`Break: ${Math.floor(breakTimeLeft / 60)}:${(breakTimeLeft % 60).toString().padStart(2, '0')} left`);
  } else {
    tray.setToolTip(`Work: ${Math.floor(workTimeLeft / 60)}:${(workTimeLeft % 60).toString().padStart(2, '0')} left`);
  }
}

function showBreakWindow() {
  if (breakWindow) return;
  breakWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    breakWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '#break');
  } else {
    breakWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), { hash: 'break' });
  }
  breakWindow.setMenuBarVisibility(false);
  breakWindow.on('closed', () => {
    breakWindow = null;
  });
}

function closeBreakWindow() {
  if (breakWindow) {
    breakWindow.close();
    breakWindow = null;
  }
}

function updateTrayMenu() {
  if (!tray) return;
  const menuTemplate = [
    {
      label: isPaused ? 'Resume' : 'Pause',
      click: () => {
        if (isPaused) {
          resumeTimer();
        } else {
          pauseTimer();
        }
        updateTrayMenu();
      },
    },
    isOnBreak
      ? {
          label: 'Skip Break',
          click: () => {
            if (isOnBreak) {
              clearInterval(breakTimer!);
              closeBreakWindow();
              startWorkTimer();
            }
          },
        }
      : null,
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ].filter(Boolean);
  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate as any));
}

function pauseTimer() {
  isPaused = true;
  if (isOnBreak) {
    if (breakTimer) clearInterval(breakTimer);
  } else {
    if (workTimer) clearInterval(workTimer);
  }
}

function resumeTimer() {
  isPaused = false;
  if (isOnBreak) {
    if (breakTimer) clearInterval(breakTimer);
    breakTimer = setInterval(() => {
      breakTimeLeft--;
      updateTrayTooltip();
      if (breakWindow) {
        breakWindow.webContents.send('break-timer', breakTimeLeft);
      }
      if (breakTimeLeft <= 0) {
        clearInterval(breakTimer!);
        closeBreakWindow();
        startWorkTimer();
      }
    }, 1000);
  } else {
    if (workTimer) clearInterval(workTimer);
    workTimer = setInterval(() => {
      workTimeLeft--;
      updateTrayTooltip();
      if (workTimeLeft <= 0) {
        clearInterval(workTimer!);
        startBreakTimer();
      }
    }, 1000);
  }
}

// Update all timer functions to call updateTrayMenu()
function startWorkTimer() {
  isOnBreak = false;
  workTimeLeft = WORK_DURATION;
  updateTrayTooltip();
  updateTrayMenu();
  if (workTimer) clearInterval(workTimer);
  workTimer = setInterval(() => {
    if (!isPaused) {
      workTimeLeft--;
      updateTrayTooltip();
      if (workTimeLeft <= 0) {
        clearInterval(workTimer!);
        startBreakTimer();
      }
    }
  }, 1000);
}

function startBreakTimer() {
  isOnBreak = true;
  breakTimeLeft = BREAK_DURATION;
  updateTrayTooltip();
  updateTrayMenu();
  showBreakWindow();
  if (breakTimer) clearInterval(breakTimer);
  breakTimer = setInterval(() => {
    if (!isPaused) {
      breakTimeLeft--;
      updateTrayTooltip();
      if (breakWindow) {
        breakWindow.webContents.send('break-timer', breakTimeLeft);
      }
      if (breakTimeLeft <= 0) {
        clearInterval(breakTimer!);
        closeBreakWindow();
        startWorkTimer();
      }
    }
  }, 1000);
}

// IPC for skipping break
ipcMain.on('skip-break', () => {
  if (isOnBreak) {
    clearInterval(breakTimer!);
    closeBreakWindow();
    startWorkTimer();
  }
});

const createTray = () => {
  // Use the provided icon from the assets folder for the tray
  const icon = nativeImage.createFromPath(path.join(process.cwd(), 'assets', 'icon.ico'));
  if (process.platform === 'darwin' && icon.setTemplateImage) {
    icon.setTemplateImage(true);
  }
  tray = new Tray(icon);
  updateTrayMenu();
  updateTrayTooltip();
};

// Hide dock icon on macOS for tray-only experience
if (process.platform === 'darwin') {
  app.dock.hide();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createTray();
  createWindow();
  startWorkTimer();
});

// Prevent quitting on macOS when all windows are closed
app.on('window-all-closed', (e?: Electron.Event) => {
  if (process.platform === 'darwin') {
    if (e) e.preventDefault();
  } else {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
