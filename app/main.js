// App de PC da Nossa Live: mesma página, mas a captura de tela passa pelo
// seletor próprio do app, sem a tarja "está compartilhando sua tela" do navegador.
const { app, BrowserWindow, session, desktopCapturer, ipcMain } = require('electron');
const path = require('path');

// Endereço público do site depois de publicado (ex.: https://seunome.github.io/nossa-live/).
// Vazio = abre o arquivo local; nesse caso o "Copiar link" não serve para os amigos.
const SITE_URL = '';

let win;

function criarJanela() {
  win = new BrowserWindow({
    width: 1400, height: 860, backgroundColor: '#0d0f14', autoHideMenuBar: true, title: 'Nossa Live',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false },
  });

  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, perm, cb) =>
    cb(['media', 'display-capture', 'clipboard-sanitized-write', 'fullscreen'].includes(perm)));

  ses.setDisplayMediaRequestHandler(async (req, callback) => {
    const fontes = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 } });
    ipcMain.removeAllListeners('fonte-escolhida');
    ipcMain.once('fonte-escolhida', (e, id, audio) => {
      const f = fontes.find(x => x.id === id);
      if (!f) return callback({});
      // 'loopback' = áudio do sistema do Windows
      callback(audio ? { video: f, audio: 'loopback' } : { video: f });
    });
    win.webContents.send('escolher-fonte', fontes.map(f => ({ id: f.id, nome: f.name, miniatura: f.thumbnail.toDataURL() })));
  });

  if (SITE_URL) win.loadURL(SITE_URL);
  else win.loadFile(path.join(__dirname, '..', 'index.html'));
}

ipcMain.on('site-url', e => { e.returnValue = SITE_URL; });

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.whenReady().then(criarJanela);
app.on('window-all-closed', () => app.quit());
