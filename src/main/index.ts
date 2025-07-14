import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, MenuItem, powerMonitor, nativeTheme } from 'electron';
import path from 'node:path';
import fs from 'fs';

const DEFAULT_WORK_DURATION = 60 * 25
const DEFAULT_BREAK_DURATION = 60 * 2

const isDev = !app.isPackaged

// Settings persistence
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (e) {
    // Ignore errors and use defaults
  }
  return { workDuration: DEFAULT_WORK_DURATION, breakDuration: DEFAULT_BREAK_DURATION };
}
function saveSettings(settings: { workDuration: number; breakDuration: number }) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings));
}
let userSettings = loadSettings();
let WORK_DURATION = 10;
let BREAK_DURATION = userSettings.breakDuration;
let tray: Tray | null = null;
let workTimer: NodeJS.Timeout | null = null;
let workTimeLeft = WORK_DURATION;
let isOnBreak = false;
let breakTimer: NodeJS.Timeout | null = null;
let breakTimeLeft = BREAK_DURATION;
let breakWindows: BrowserWindow[] = [];
let isPaused = false;
let isStopped = false;
let settingsWindow: BrowserWindow | null = null;
let isIdle = false;

function updateTrayTooltip() {
  if (!tray) return;
  let timeLabel = '';
  if (isIdle) {
    timeLabel = 'idle';
    tray.setToolTip('Timer paused (idle)');
  } else if (!isOnBreak && !isStopped) {
    if (workTimeLeft >= 60) {
      timeLabel = `${Math.ceil(workTimeLeft / 60)}m`;
    } else {
      timeLabel = `${workTimeLeft}s`;
    }
    tray.setToolTip(`Work: ${Math.floor(workTimeLeft / 60)}:${(workTimeLeft % 60).toString().padStart(2, '0')} left`);
  } else if (isOnBreak) {
    tray.setToolTip(`Break: ${Math.floor(breakTimeLeft / 60)}:${(breakTimeLeft % 60).toString().padStart(2, '0')} left`);
    timeLabel = '';
  } else if (isStopped) {
    tray.setToolTip('Timer stopped');
    timeLabel = '';
  }
  if (process.platform === 'darwin') {
    tray.setTitle(timeLabel);
  }
}

function showBreakWindow() {
  if (breakWindows.length > 0) return;
  const displays = screen.getAllDisplays();
  breakWindows = displays.map(display => {
    const { width, height, x, y } = display.bounds;
    const win = new BrowserWindow({
      width,
      height,
      x,
      y,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      hasShadow: false,
      resizable: false,
      movable: false,
      focusable: true,
      fullscreenable: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      },
    });
    const primaryDisplay = screen.getPrimaryDisplay();
    win.setBounds(primaryDisplay.bounds); // set window to exact screen size
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setSimpleFullScreen(true)
    if (isDev) {
      win.loadURL('http://localhost:5173/#break');
    } else {
      win.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'break' });
    }
    win.setMenuBarVisibility(false);
    win.on('closed', () => {
      breakWindows = breakWindows.filter(w => w !== win);
    });
    return win;
  });
}

function closeBreakWindow() {
  breakWindows.forEach(win => {
    if (!win.isDestroyed()) win.close();
  });
  breakWindows = [];
}

function showSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 350,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });
  if (isDev) {
    settingsWindow.loadURL('http://localhost:5173/#settings');
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'settings' });
  }
  // settingsWindow.webContents.openDevTools()
  settingsWindow.setMenuBarVisibility(false);

  // Send timer countdown to settings window every second
  let settingsTimerInterval: NodeJS.Timeout | null = null;
  function sendSettingsTimer() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      const countdown = isOnBreak ? breakTimeLeft : workTimeLeft;
      settingsWindow.webContents.send('settings-timer', countdown);
    }
  }
  settingsWindow.on('closed', () => {
    if (settingsTimerInterval) clearInterval(settingsTimerInterval);
    settingsWindow = null;
  });
  settingsWindow.once('ready-to-show', () => {
    sendSettingsTimer();
    settingsTimerInterval = setInterval(sendSettingsTimer, 1000);
  });
  // Fallback: start interval after a short delay in case 'ready-to-show' is not triggered
  setTimeout(() => {
    if (!settingsTimerInterval && settingsWindow && !settingsWindow.isDestroyed()) {
      sendSettingsTimer();
      settingsTimerInterval = setInterval(sendSettingsTimer, 1000);
    }
  }, 1000);
}

function stopTimer() {
  isStopped = true;
  if (workTimer) clearInterval(workTimer);
  if (breakTimer) clearInterval(breakTimer);
  workTimeLeft = WORK_DURATION;
  breakTimeLeft = BREAK_DURATION;
  isOnBreak = false;
  updateTrayTooltip();
  updateTrayMenu();
}

function startTimer() {
  isStopped = false;
  workTimeLeft = WORK_DURATION;
  breakTimeLeft = BREAK_DURATION;
  isOnBreak = false;
  updateTrayTooltip();
  startWorkTimer();
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const menuTemplate = [
    (!isStopped && !isPaused && !isOnBreak) ? {
      label: 'Start next break',
      click: () => {
        if (!isOnBreak && !isPaused && !isStopped) {
          if (workTimer) clearInterval(workTimer);
          startBreakTimer();
          updateTrayMenu();
        }
      },
    } : null,
    !isStopped ? {
      label: isPaused ? 'Resume' : 'Pause',
      click: () => {
        if (isPaused) {
          resumeTimer();
        } else {
          pauseTimer();
        }
        updateTrayMenu();
      },
    } : {
      label: 'Start',
      click: () => {
        startTimer();
      },
    },
    !isStopped ? {
      label: 'Stop',
      click: () => {
        stopTimer();
      },
    } : null,
    {
      label: 'Settings',
      click: () => {
        showSettingsWindow();
      },
    },
    isOnBreak && !isStopped
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
      breakWindows.forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('break-timer', breakTimeLeft);
      });
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

// Update timer logic to respect isStopped
function startWorkTimer() {
  if (isStopped) return;
  isOnBreak = false;
  workTimeLeft = WORK_DURATION;
  updateTrayTooltip();
  updateTrayMenu();
  if (workTimer) clearInterval(workTimer);
  workTimer = setInterval(() => {
    if (!isPaused && !isStopped) {
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
  if (isStopped) return;
  isOnBreak = true;
  breakTimeLeft = BREAK_DURATION;
  updateTrayTooltip();
  updateTrayMenu();
  showBreakWindow();
  if (breakTimer) clearInterval(breakTimer);
  breakTimer = setInterval(() => {
    if (!isPaused && !isStopped) {
      breakTimeLeft--;
      updateTrayTooltip();
      breakWindows.forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('break-timer', breakTimeLeft);
      });
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

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});

ipcMain.on('save-settings', (_event, { workDuration, breakDuration }) => {
  userSettings = { workDuration, breakDuration };
  saveSettings(userSettings);
  WORK_DURATION = workDuration;
  BREAK_DURATION = breakDuration;
  if (isOnBreak) {
    if (breakTimer) clearInterval(breakTimer);
    breakTimeLeft = BREAK_DURATION;
    startBreakTimer();
  } else {
    if (workTimer) clearInterval(workTimer);
    workTimeLeft = WORK_DURATION;
    startWorkTimer();
  }
});
ipcMain.on('get-settings', (event) => {
  event.reply('settings-data', userSettings);
});

const createTray = () => {
  // Use the provided icon from the assets folder for the tray
  const icon = nativeImage.createFromPath(path.join(process.cwd(), 'assets', 'icon-mac.png'));
  if (process.platform === 'darwin' && icon.setTemplateImage) {
    icon.setTemplateImage(true);
  }
  tray = new Tray(icon);
  setInterval(updateTrayTooltip, 1000)
};

// Hide dock icon on macOS for tray-only experience
if (process.platform === 'darwin') {
  app.dock?.hide();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 350,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  // and load the index.html of the app.
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

// Add a menu bar item that shows the break countdown
let breakMenuItem: Electron.MenuItem | null = null;
function updateAppMenu() {
  const time = !isOnBreak ? `${String(Math.floor(workTimeLeft / 60)).padStart(2, '0')}:${(workTimeLeft % 60).toString().padStart(2, '0')}` : '--:--';
  breakMenuItem = new MenuItem({
    label: `Your break starts in ${time}`,
    enabled: false,
  });
  const menu = Menu.buildFromTemplate([
    breakMenuItem,
    // ... add other menu items here if needed
  ]);
  Menu.setApplicationMenu(menu);
}
// Call updateAppMenu every second
setInterval(updateAppMenu, 1000);

// Idle detection logic
setInterval(() => {
  const idleSeconds = powerMonitor.getSystemIdleTime();
  if(isOnBreak || isStopped || isPaused) return
  if (idleSeconds >= 120 && idleSeconds < 300) {
    if (!isIdle) {
      isIdle = true;
      if (!isStopped) pauseTimer();
      updateTrayTooltip();
      updateTrayMenu();
    }
  } else if (idleSeconds >= 300) {
    if (!isStopped) {
      isIdle = false;
      isStopped = true;
      stopTimer();
      updateTrayTooltip();
      updateTrayMenu();
    }
  } else {
    if (isIdle) {
      isIdle = false;
      if (!isStopped) resumeTimer();
      updateTrayTooltip();
      updateTrayMenu();
    } else if (isStopped && idleSeconds < 300) {
      // User returned after >5min idle, reset and start
      isStopped = false;
      startTimer();
      updateTrayTooltip();
      updateTrayMenu();
    }
  }
}, 2000);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createTray();
  createWindow();
  startTimer(); // Changed from startWorkTimer() to startTimer()
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

ipcMain.handle('getTheme', () => nativeTheme.shouldUseDarkColors);