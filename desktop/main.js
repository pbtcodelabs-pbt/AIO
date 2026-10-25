// ===================== AIO POS — ونڈوز پروگرام (Electron) =====================
// ایپ ہمیشہ لائیو ویب ورژن سے کھلتی ہے (اپڈیٹ خود)، پہلی بار کے بعد انٹرنیٹ کے بغیر بھی (Service Worker)۔
// خاص سہولتیں: بغیر پوچھے سیدھا پرنٹ (Default Printer یا چنا ہوا پرنٹر)، زوم یاد رہے، واٹس ایپ/بیرونی لنک براؤزر میں۔
const { app, BrowserWindow, ipcMain, shell, Menu, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'app-config.json'), 'utf8'));
const APP_URL = CONFIG.url;
const APP_BASE = APP_URL.replace(/[^/]*$/, ''); // https://…/AIO/

const settingsPath = () => path.join(app.getPath('userData'), 'desktop-settings.json');
let settings = { zoom: 1, silentPrint: true, printer: '' };
function loadSettings(){
  try{ settings = Object.assign(settings, JSON.parse(fs.readFileSync(settingsPath(), 'utf8'))); }catch(e){}
}
function saveSettings(){
  try{ fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2)); }catch(e){}
}

let win = null;

if(!app.requestSingleInstanceLock()){
  app.quit();
} else {
  app.on('second-instance', () => { if(win){ if(win.isMinimized()) win.restore(); win.focus(); } });
}

function isAppUrl(u){ return typeof u === 'string' && u.startsWith(APP_BASE); }

function setZoom(z){
  settings.zoom = Math.max(0.5, Math.min(2, Math.round(z * 100) / 100));
  if(win) win.webContents.setZoomFactor(settings.zoom);
  saveSettings();
}

async function buildMenu(){
  let printers = [];
  try{ printers = win ? await win.webContents.getPrintersAsync() : []; }catch(e){}
  const printerItems = [{
    label: 'Windows default printer', type: 'radio', checked: !settings.printer,
    click: () => { settings.printer = ''; saveSettings(); }
  }].concat(printers.map(p => ({
    label: p.displayName || p.name, type: 'radio', checked: settings.printer === p.name,
    click: () => { settings.printer = p.name; saveSettings(); }
  })));
  const template = [
    { label: 'View', submenu: [
      { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => setZoom(settings.zoom + 0.1) },
      { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => setZoom(settings.zoom - 0.1) },
      { label: 'Reset Zoom (100%)', accelerator: 'CmdOrCtrl+0', click: () => setZoom(1) },
      { type: 'separator' },
      { label: 'Full Screen', accelerator: 'F11', click: () => win && win.setFullScreen(!win.isFullScreen()) },
      { label: 'Reload', accelerator: 'F5', click: () => win && win.webContents.reload() }
    ]},
    { label: 'Printing', submenu: [
      { label: 'Print directly (no print window)', type: 'checkbox', checked: !!settings.silentPrint,
        click: (item) => { settings.silentPrint = item.checked; saveSettings(); } },
      { type: 'separator' },
      { label: 'Printer', submenu: printerItems },
      { label: 'Refresh printer list', click: () => buildMenu() }
    ]},
    { label: 'Help', submenu: [
      { label: 'WhatsApp support (PBT Code Labs)', click: () => shell.openExternal('https://wa.me/' + (CONFIG.supportWhatsapp || '')) },
      { label: 'About', click: () => dialog.showMessageBox(win, { type: 'info', title: CONFIG.name, message: `${CONFIG.name} for Windows\nVersion ${app.getVersion()}\nPBT Code Labs` }) }
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow(){
  win = new BrowserWindow({
    width: 1366, height: 820, minWidth: 900, minHeight: 600,
    show: false, autoHideMenuBar: true, backgroundColor: '#0f766e', title: CONFIG.name,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false }
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  win.webContents.on('did-finish-load', () => win.webContents.setZoomFactor(settings.zoom || 1));
  win.webContents.on('zoom-changed', (e, dir) => setZoom(settings.zoom + (dir === 'in' ? 0.1 : -0.1))); // Ctrl + ماؤس وہیل

  // ---------- واٹس ایپ/بیرونی لنک ڈیفالٹ براؤزر میں؛ PDF/بلاب (بل کا A4) اسی پروگرام کی کھڑکی میں ----------
  win.webContents.setWindowOpenHandler(({ url }) => {
    if(url.startsWith('blob:') || url.startsWith('data:') || isAppUrl(url) || url === 'about:blank') return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if(!isAppUrl(url) && !url.startsWith('file:')){ e.preventDefault(); shell.openExternal(url); }
  });

  // ---------- انٹرنیٹ نہ ہو اور کیش بھی نہ ہو (پہلی بار) تو صاف پیغام ----------
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => {
    if(isMain && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: APP_URL } });
  });

  win.loadURL(APP_URL);
}

// ---------- پرنٹ: Silent آن ہو تو بغیر پوچھے، ورنہ ونڈوز کی پرنٹ کھڑکی ----------
ipcMain.handle('aio-print', () => new Promise((resolve) => {
  if(!win) return resolve({ ok: false });
  const opts = { silent: !!settings.silentPrint, printBackground: true, margins: { marginType: 'none' } };
  if(settings.silentPrint && settings.printer) opts.deviceName = settings.printer;
  win.webContents.print(opts, (ok, reason) => resolve({ ok, reason }));
}));
ipcMain.handle('aio-printers', async () => { try{ return await win.webContents.getPrintersAsync(); }catch(e){ return []; } });
ipcMain.handle('aio-settings', () => settings);

app.whenReady().then(() => {
  loadSettings();
  // کیمرہ (بارکوڈ اسکین)، کلپ بورڈ، نوٹیفکیشن — اسی ایپ کے لیے اجازت
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(['media', 'clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen'].includes(permission));
  });
  createWindow();
  buildMenu();
});

app.on('window-all-closed', () => app.quit());
