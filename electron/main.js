const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const http = require('node:http');
const RPC = require('discord-rpc');
const Store = require('electron-store');
const https = require('node:https');

const store = new Store({
  defaults: {
    clientId: '',
    activities: [],
    profiles: [{ id: 'default', name: '기본 프로필', activities: [] }],
    activeProfileId: 'default',
    currentActivityIndex: -1,
    autoDetect: { enabled: false, mappings: [], interval: 5000 },
    launchOnStartup: false,
    minimizeToTray: true,
    ytMusic: {
      enabled: false,
      port: 8686,
      clientId: '',
      showAlbumArt: true,
      showTimer: true,
      buttons: [],
    },
  },
});

let mainWindow = null;
let tray = null;
let rpcClient = null;
let rpcConnected = false;
let processDetectorInterval = null;
let currentRpcClientId = null; // Track which Client ID is currently connected

// YouTube Music HTTP Server
let ytMusicServer = null;
let ytMusicCurrentTrack = null;
let ytMusicServerRunning = false;
let ytMusicLastUpdate = 0;
let ytMusicStaleTimer = null;
let ytMusicExtensionConnected = false;
let ytMusicExtensionTimer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '..', 'public', 'tray-icon.png'),
  });

  // 모든 외부 링크는 기본 브라우저로 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const { shell } = require('electron');
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (e, url) => {
    const appUrl = app.isPackaged
      ? `file://${path.join(__dirname, '..', 'dist')}`
      : 'http://localhost:5173';
    if (!url.startsWith(appUrl)) {
      e.preventDefault();
      const { shell } = require('electron');
      shell.openExternal(url);
    }
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!app.isQuitting && store.get('minimizeToTray') && tray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  let icon;
  try {
    icon = nativeImage.createFromPath(path.join(__dirname, '..', 'public', 'tray-icon.png'));
    if (icon.isEmpty()) icon = nativeImage.createEmpty();
  } catch {
    icon = nativeImage.createEmpty();
  }
  tray = new Tray(icon);
  tray.setToolTip('Discord RPC Manager');
  tray.on('double-click', () => mainWindow?.show());
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const activities = store.get('activities') || [];
  const currentIdx = store.get('currentActivityIndex');

  const activityItems = activities.map((act, i) => ({
    label: `${currentIdx === i ? '● ' : '  '}${act.name}`,
    type: 'normal',
    click: async () => {
      if (currentIdx === i) {
        // Already active → deactivate
        store.set('currentActivityIndex', -1);
        if (rpcClient) rpcClient.clearActivity();
        mainWindow?.webContents.send('activity-changed', -1);
      } else {
        // Activate this activity
        store.set('currentActivityIndex', i);
        const targetClientId = act.clientId || store.get('clientId');
        if (targetClientId && targetClientId !== currentRpcClientId) {
          await connectRPC(targetClientId);
          await new Promise(r => setTimeout(r, 500));
        }
        await setActivity(act);
        mainWindow?.webContents.send('activity-changed', i);
      }
      updateTrayMenu();
    },
  }));

  const template = [
    { label: 'Discord RPC Manager', enabled: false },
    { type: 'separator' },
    { label: '활동 관리', enabled: false },
    ...(activityItems.length > 0
      ? activityItems
      : [{ label: '  등록된 활동 없음', enabled: false }]),
    { type: 'separator' },
    { label: '열기', click: () => mainWindow?.show() },
    {
      label: rpcConnected ? 'RPC 연결 해제' : 'RPC 연결',
      click: () => {
        if (rpcConnected) disconnectRPC();
        else connectRPC();
        setTimeout(updateTrayMenu, 500);
      },
    },
    { type: 'separator' },
    { label: '종료', click: () => { app.isQuitting = true; app.quit(); } },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(template));
}

// Discord RPC
async function connectRPC(overrideClientId = null) {
  const clientId = overrideClientId || store.get('clientId');
  if (!clientId) {
    mainWindow?.webContents.send('rpc-status', { connected: false, error: 'Client ID가 설정되지 않았습니다.' });
    return;
  }

  // Skip reconnect if already connected with the same Client ID
  if (rpcConnected && currentRpcClientId === clientId) return;

  try {
    if (rpcClient) {
      rpcClient.destroy();
      rpcClient = null;
    }

    rpcClient = new RPC.Client({ transport: 'ipc' });

    rpcClient.on('ready', () => {
      rpcConnected = true;
      currentRpcClientId = clientId;
      console.log('[RPC] Connected as', rpcClient.user.username, '(App:', clientId, ')');
      mainWindow?.webContents.send('rpc-status', {
        connected: true,
        user: { username: rpcClient.user.username, id: rpcClient.user.id },
      });
      updateTrayMenu();

      const idx = store.get('currentActivityIndex');
      if (idx >= 0) {
        const activities = store.get('activities');
        if (activities[idx]) {
          console.log('[RPC] Auto-setting activity:', activities[idx].name);
          setActivity(activities[idx]).catch(console.error);
        }
      }
    });

    rpcClient.on('disconnected', () => {
      rpcConnected = false;
      currentRpcClientId = null;
      mainWindow?.webContents.send('rpc-status', { connected: false });
    });

    await rpcClient.login({ clientId });
  } catch (err) {
    rpcConnected = false;
    currentRpcClientId = null;
    mainWindow?.webContents.send('rpc-status', { connected: false, error: err.message });
  }
}

function disconnectRPC() {
  if (rpcClient) {
    rpcClient.clearActivity();
    rpcClient.destroy();
    rpcClient = null;
  }
  rpcConnected = false;
  currentRpcClientId = null;
  mainWindow?.webContents.send('rpc-status', { connected: false });
  updateTrayMenu();
}

// Discord requires string fields to be 2–128 chars; returns undefined if too short
function sanitize(text, min = 2, max = 128) {
  if (!text || text.trim().length < min) return undefined;
  return text.trim().slice(0, max);
}

async function setActivity(activity) {
  if (!rpcClient || !rpcConnected) {
    console.log('[RPC] setActivity skipped: not connected');
    return;
  }

  const presence = {};

  // details / state — Discord requires 2+ chars
  const details = sanitize(activity.details);
  const state = sanitize(activity.state);
  if (details) presence.details = details;
  if (state) presence.state = state;

  // Timestamp
  if (activity.showTimer) {
    presence.startTimestamp = Date.now();
  }

  // Images — only include text if key is present
  const largeImageKey = sanitize(activity.largeImageKey, 1);
  const smallImageKey = sanitize(activity.smallImageKey, 1);
  if (largeImageKey) {
    presence.largeImageKey = largeImageKey;
    const largeText = sanitize(activity.largeImageText, 1);
    if (largeText) presence.largeImageText = largeText;
  }
  if (smallImageKey) {
    presence.smallImageKey = smallImageKey;
    const smallText = sanitize(activity.smallImageText, 1);
    if (smallText) presence.smallImageText = smallText;
  }

  // Buttons — must have label + valid URL
  const validButtons = (activity.buttons || [])
    .filter((b) => b.label && b.url && b.url.startsWith('http'))
    .slice(0, 2);
  if (validButtons.length > 0) presence.buttons = validButtons;

  console.log('[RPC] Setting activity:', JSON.stringify(presence));

  try {
    await rpcClient.setActivity(presence);
    console.log('[RPC] Activity set successfully');
  } catch (err) {
    console.error('[RPC] setActivity error:', err.message);
    mainWindow?.webContents.send('rpc-status', { connected: rpcConnected, error: err.message });
  }
}

// Process detection
function startProcessDetection() {
  stopProcessDetection();
  const config = store.get('autoDetect');
  if (!config.enabled) return;

  processDetectorInterval = setInterval(async () => {
    try {
      const { exec } = require('child_process');
      exec('tasklist /fo csv /nh', (err, stdout) => {
        if (err) return;
        const processes = stdout.split('\n').map((line) => {
          const match = line.match(/"([^"]+)"/);
          return match ? match[1].toLowerCase() : '';
        });

        // Re-read config each tick so mapping changes take effect immediately
        const currentConfig = store.get('autoDetect');
        if (!currentConfig.enabled) return;
        const mappings = currentConfig.mappings || [];
        for (const mapping of mappings) {
          const processName = mapping.processName.toLowerCase();
          if (processes.some((p) => p.includes(processName))) {
            const activities = store.get('activities');
            const idx = activities.findIndex((a) => a.id === mapping.activityId);
            if (idx >= 0 && idx !== store.get('currentActivityIndex')) {
              store.set('currentActivityIndex', idx);
              setActivity(activities[idx]);
              mainWindow?.webContents.send('activity-changed', idx);
            }
            break;
          }
        }
      });
    } catch (e) {
      // ignore
    }
  }, config.interval || 5000);
}

function stopProcessDetection() {
  if (processDetectorInterval) {
    clearInterval(processDetectorInterval);
    processDetectorInterval = null;
  }
}

// ── YouTube Music HTTP Server ──────────────────────────────────────
function startYtMusicServer() {
  const config = store.get('ytMusic');
  const port = config.port || 8686;

  if (ytMusicServer) stopYtMusicServer();

  ytMusicServer = http.createServer((req, res) => {
    // CORS headers for Chrome extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/ytmusic') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);

          // Mark extension as connected
          if (!ytMusicExtensionConnected) {
            ytMusicExtensionConnected = true;
            mainWindow?.webContents.send('ytmusic-extension-status', true);
          }
          // Reset extension disconnect timer (6 seconds without data = disconnected)
          if (ytMusicExtensionTimer) clearTimeout(ytMusicExtensionTimer);
          ytMusicExtensionTimer = setTimeout(() => {
            ytMusicExtensionConnected = false;
            mainWindow?.webContents.send('ytmusic-extension-status', false);
          }, 6000);

          if (data.stopped) {
            // Playback stopped
            ytMusicCurrentTrack = null;
            ytMusicLastUpdate = 0;
            clearYtMusicPresence();
            mainWindow?.webContents.send('ytmusic-update', null);
          } else {
            ytMusicCurrentTrack = data;
            ytMusicLastUpdate = Date.now();
            updateYtMusicPresence(data);
            mainWindow?.webContents.send('ytmusic-update', data);

            // Reset stale timer
            if (ytMusicStaleTimer) clearTimeout(ytMusicStaleTimer);
            ytMusicStaleTimer = setTimeout(() => {
              // No update for 10 seconds → clear presence
              if (Date.now() - ytMusicLastUpdate >= 10000) {
                ytMusicCurrentTrack = null;
                clearYtMusicPresence();
                mainWindow?.webContents.send('ytmusic-update', null);
              }
            }, 10000);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/ytmusic/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        running: true,
        currentTrack: ytMusicCurrentTrack,
        rpcConnected,
      }));
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  ytMusicServer.listen(port, '127.0.0.1', () => {
    ytMusicServerRunning = true;
    console.log(`[YTMusic] HTTP server listening on 127.0.0.1:${port}`);
    mainWindow?.webContents.send('ytmusic-server-status', { running: true, port });
  });

  ytMusicServer.on('error', (err) => {
    console.error('[YTMusic] Server error:', err.message);
    ytMusicServerRunning = false;
    mainWindow?.webContents.send('ytmusic-server-status', { running: false, error: err.message });
  });
}

function stopYtMusicServer() {
  if (ytMusicStaleTimer) { clearTimeout(ytMusicStaleTimer); ytMusicStaleTimer = null; }
  if (ytMusicExtensionTimer) { clearTimeout(ytMusicExtensionTimer); ytMusicExtensionTimer = null; }
  if (ytMusicServer) {
    ytMusicServer.close();
    ytMusicServer = null;
  }
  ytMusicServerRunning = false;
  ytMusicCurrentTrack = null;
  ytMusicExtensionConnected = false;
  clearYtMusicPresence();
  mainWindow?.webContents.send('ytmusic-server-status', { running: false });
  mainWindow?.webContents.send('ytmusic-extension-status', false);
  console.log('[YTMusic] Server stopped');
}

async function updateYtMusicPresence(track) {
  if (!track || !track.isPlaying) {
    clearYtMusicPresence();
    return;
  }

  const config = store.get('ytMusic');
  const targetClientId = config.clientId || store.get('clientId');
  if (!targetClientId) return;

  // Reconnect with YouTube Music Client ID if needed
  if (targetClientId !== currentRpcClientId) {
    await connectRPC(targetClientId);
    await new Promise(r => setTimeout(r, 500));
  }

  if (!rpcClient || !rpcConnected) return;

  const presence = {};

  const details = sanitize(track.title);
  const state = sanitize(track.artist);
  if (details) presence.details = details;
  if (state) presence.state = state;

  // Show elapsed time
  if (config.showTimer && track.currentTime != null && track.duration > 0) {
    // Calculate start timestamp based on current position
    presence.startTimestamp = Math.floor(Date.now() / 1000) - Math.floor(track.currentTime);
    presence.endTimestamp = Math.floor(Date.now() / 1000) + Math.floor(track.duration - track.currentTime);
  }

  // Album art as large image (YouTube Music thumbnail URL)
  if (config.showAlbumArt && track.thumbnail) {
    presence.largeImageKey = track.thumbnail;
    const albumText = sanitize(track.album, 1);
    if (albumText) presence.largeImageText = albumText;
  }

  // Small icon — YouTube Music branding
  presence.smallImageKey = 'https://music.youtube.com/img/on_platform_logo_dark.svg';
  presence.smallImageText = 'YouTube Music';

  // Buttons
  const buttons = (config.buttons || [])
    .filter(b => b.label && b.url && b.url.startsWith('http'))
    .slice(0, 2);

  // Add "Listen on YouTube Music" button if track URL available and less than 2 buttons
  if (track.url && buttons.length < 2) {
    buttons.push({ label: 'YouTube Music에서 듣기', url: track.url });
  }
  if (buttons.length > 0) presence.buttons = buttons.slice(0, 2);

  try {
    await rpcClient.setActivity(presence);
    console.log('[YTMusic] Presence updated:', track.title, '-', track.artist);
  } catch (err) {
    console.error('[YTMusic] setActivity error:', err.message);
  }
}

function clearYtMusicPresence() {
  if (rpcClient && rpcConnected) {
    rpcClient.clearActivity().catch(() => {});
  }
}

// IPC Handlers
ipcMain.handle('get-store', (_, key) => store.get(key));
ipcMain.handle('set-store', (_, key, value) => {
  store.set(key, value);
  // Refresh tray menu when activities or current index changes
  if (key === 'activities' || key === 'currentActivityIndex') updateTrayMenu();
  return true;
});

ipcMain.handle('rpc-connect', () => connectRPC());
ipcMain.handle('rpc-disconnect', () => disconnectRPC());
ipcMain.handle('rpc-set-activity', async (_, activity) => {
  console.log('[IPC] rpc-set-activity received:', activity?.name);
  const activityClientId = activity?.clientId;
  const defaultClientId = store.get('clientId');
  const targetClientId = activityClientId || defaultClientId;

  // Reconnect with different Client ID if needed
  if (targetClientId && targetClientId !== currentRpcClientId) {
    console.log('[RPC] Switching Client ID to:', targetClientId);
    await connectRPC(targetClientId);
    // After reconnect, the ready handler will auto-set the activity
    // But we also set it explicitly to be safe
    await new Promise(r => setTimeout(r, 500));
  }
  return setActivity(activity);
});
ipcMain.handle('rpc-clear-activity', () => { if (rpcClient) rpcClient.clearActivity(); });
ipcMain.handle('rpc-get-status', () => ({
  connected: rpcConnected,
  user: rpcConnected && rpcClient?.user ? { username: rpcClient.user.username, id: rpcClient.user.id } : null,
}));

ipcMain.handle('process-detect-start', () => startProcessDetection());
ipcMain.handle('process-detect-stop', () => stopProcessDetection());
ipcMain.handle('get-running-processes', () => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('tasklist /fo csv /nh', (err, stdout) => {
      if (err) return resolve([]);
      const names = [...new Set(
        stdout.split('\n')
          .map((line) => { const m = line.match(/"([^"]+)"/); return m ? m[1] : ''; })
          .filter(Boolean)
      )];
      resolve(names);
    });
  });
});

// 프로세스 이름으로 실행 파일 경로 찾기 + 아이콘 추출
ipcMain.handle('get-app-icon', async (_, processName) => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    // wmic으로 실행 파일 경로 조회
    exec(
      `wmic process where "name='${processName}'" get ExecutablePath /format:csv`,
      async (err, stdout) => {
        if (err) return resolve(null);
        const lines = stdout.trim().split('\n').filter(Boolean);
        let exePath = null;
        for (const line of lines) {
          const parts = line.split(',');
          const candidate = parts[parts.length - 1]?.trim();
          if (candidate && candidate.endsWith('.exe') && candidate.includes('\\')) {
            exePath = candidate;
            break;
          }
        }
        if (!exePath) return resolve(null);
        try {
          const icon = await app.getFileIcon(exePath, { size: 'large' });
          resolve(icon.toDataURL());
        } catch {
          resolve(null);
        }
      }
    );
  });
});

// 여러 프로세스 아이콘 일괄 조회
ipcMain.handle('get-app-icons-batch', async (_, processNames) => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    // wmic으로 모든 실행 경로 한번에 가져오기
    exec(
      'wmic process get Name,ExecutablePath /format:csv',
      async (err, stdout) => {
        if (err) return resolve({});
        const pathMap = {};
        const lines = stdout.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length < 3) continue;
          const exePath = parts[1]?.trim();
          const name = parts[2]?.trim()?.toLowerCase();
          if (name && exePath && exePath.endsWith('.exe')) {
            pathMap[name] = exePath;
          }
        }

        const result = {};
        await Promise.all(
          processNames.map(async (pName) => {
            const key = pName.toLowerCase();
            const exePath = pathMap[key];
            if (!exePath) return;
            try {
              const icon = await app.getFileIcon(exePath, { size: 'large' });
              result[pName] = icon.toDataURL();
            } catch { /* skip */ }
          })
        );
        resolve(result);
      }
    );
  });
});

// YouTube Music IPC
ipcMain.handle('ytmusic-start', () => startYtMusicServer());
ipcMain.handle('ytmusic-stop', () => stopYtMusicServer());
ipcMain.handle('ytmusic-get-status', () => ({
  running: ytMusicServerRunning,
  port: store.get('ytMusic').port || 8686,
  currentTrack: ytMusicCurrentTrack,
  extensionConnected: ytMusicExtensionConnected,
}));
ipcMain.handle('ytmusic-set-config', (_, config) => {
  const current = store.get('ytMusic');
  const updated = { ...current, ...config };
  store.set('ytMusic', updated);

  // Restart server if port changed while running
  if (config.port && config.port !== current.port && ytMusicServerRunning) {
    stopYtMusicServer();
    startYtMusicServer();
  }

  return updated;
});

// Window controls
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window-close', () => mainWindow?.close());

// Open URL in default browser
ipcMain.handle('shell-open-external', (_, url) => {
  const { shell } = require('electron');
  return shell.openExternal(url);
});

// Launch on startup
ipcMain.handle('get-launch-on-startup', () => {
  return app.getLoginItemSettings().openAtLogin;
});
ipcMain.handle('set-launch-on-startup', (_, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
  store.set('launchOnStartup', enabled);
  return true;
});

// Fetch Discord app name from Client ID
ipcMain.handle('get-discord-app-name', async (_, clientId) => {
  if (!clientId || clientId.length < 10) return null;
  try {
    const fetch = require('node:https');
    return new Promise((resolve) => {
      const req = fetch.get(`https://discord.com/api/v10/applications/${clientId}/rpc`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.name || null);
          } catch { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    });
  } catch { return null; }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Apply launch on startup setting
  const launchOnStartup = store.get('launchOnStartup');
  app.setLoginItemSettings({ openAtLogin: !!launchOnStartup });

  const clientId = store.get('clientId');
  if (clientId) connectRPC();

  const autoDetect = store.get('autoDetect');
  if (autoDetect.enabled) startProcessDetection();

  // Start YouTube Music server if enabled
  const ytConfig = store.get('ytMusic');
  if (ytConfig.enabled) startYtMusicServer();

  // Check for updates after 3 seconds
  setTimeout(checkForUpdates, 3000);
});

// Auto-update check via GitHub Releases
function checkForUpdates() {
  const currentVersion = app.getVersion();
  const options = {
    hostname: 'api.github.com',
    path: '/repos/eisiseu/discord-rpc-manager/releases/latest',
    headers: { 'User-Agent': 'Discord-RPC-Manager' },
  };

  const req = https.get(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        const latestVersion = (release.tag_name || '').replace('v', '');
        if (!latestVersion || latestVersion === currentVersion) return;

        // Compare versions
        const current = currentVersion.split('.').map(Number);
        const latest = latestVersion.split('.').map(Number);
        const isNewer = latest[0] > current[0] ||
          (latest[0] === current[0] && latest[1] > current[1]) ||
          (latest[0] === current[0] && latest[1] === current[1] && latest[2] > current[2]);

        if (!isNewer) return;

        // Find installer asset
        const asset = (release.assets || []).find(a => a.name.endsWith('.exe'));
        const downloadUrl = asset?.browser_download_url || release.html_url;

        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: '업데이트 알림',
          message: `새 버전 v${latestVersion}이 있습니다. (현재: v${currentVersion})`,
          detail: release.body?.substring(0, 300) || '',
          buttons: ['다운로드', '나중에'],
          defaultId: 0,
        }).then(({ response }) => {
          if (response === 0) {
            const { shell } = require('electron');
            shell.openExternal(downloadUrl);
          }
        });
      } catch { /* ignore parse errors */ }
    });
  });
  req.on('error', () => { /* ignore network errors */ });
  req.setTimeout(10000, () => req.destroy());
}

app.on('before-quit', () => {
  app.isQuitting = true;
  stopYtMusicServer();
  disconnectRPC();
  stopProcessDetection();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
