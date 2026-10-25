const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let backendProcess = null;

function checkServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureBackendRunning() {
  const isUp = await checkServerReady('http://localhost:3001/api/health');
  if (isUp) return;

  const localNode = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'nodejs', 'node.exe');
  const nodeBin = fs.existsSync(localNode) ? localNode : 'node';
  const serverScript = path.join(__dirname, '..', 'server', 'index.cjs');

  backendProcess = spawn(nodeBin, ['--no-warnings', serverScript], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    windowsHide: true
  });

  // Wait up to 8 seconds for backend to be ready
  for (let i = 0; i < 20; i++) {
    const ready = await checkServerReady('http://localhost:3001/api/health');
    if (ready) break;
    await new Promise((r) => setTimeout(r, 400));
  }
}

async function createWindow() {
  await ensureBackendRunning();

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    title: 'ChemQuest ม.4 — เกมตะลุยด่านห้องแล็บการคำนวณทางเคมี',
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Check if Vite dev server (5173) is running; otherwise load from Express server (3001) or dist/index.html
  const isViteDev = await checkServerReady('http://localhost:5173');
  if (isViteDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL('http://localhost:3001');
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
