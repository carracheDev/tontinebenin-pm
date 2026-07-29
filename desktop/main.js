const { app, BrowserWindow, shell, Menu } = require('electron');

// Ubuntu 24.04+ restreint le sandbox Chromium (AppArmor / user namespaces),
// ce qui empêche l'app de démarrer. On désactive le sandbox sous Linux — l'app
// ne charge qu'une URL de confiance (le VPS), le risque est minime.
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  // Certains systèmes ont un /dev/shm mal configuré (crash « shared memory ») :
  // on bascule sur /tmp pour la mémoire partagée de Chromium.
  app.commandLine.appendSwitch('disable-dev-shm-usage');
}

// URL de l'app déployée (backend + front sur le VPS). Modifiable via variable d'env.
const APP_URL = process.env.TB_PM_URL || 'https://vps-tontinebenin.taila91a50.ts.net:10000';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0b1120',
    title: 'TontineBénin — Project Manager',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(APP_URL);

  // Les liens externes (mailto, sites tiers) s'ouvrent dans le navigateur système
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Si la connexion échoue (VPS injoignable), page de repli
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    if (code === -3) return; // requête annulée, ignore
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          `<body style="background:#0b1120;color:#e2e8f0;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;text-align:center">
             <div><h2>Connexion impossible</h2>
             <p>Impossible de joindre le serveur TontineBénin.<br>Vérifie ta connexion internet, puis relance l'application.</p>
             <p style="color:#6b7280;font-size:13px">${desc}</p></div>
           </body>`,
        ),
    );
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null); // pas de menu natif
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
