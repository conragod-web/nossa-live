const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nativo', {
  siteUrl: ipcRenderer.sendSync('site-url') || null,
  aoEscolherFonte: cb => ipcRenderer.on('escolher-fonte', (e, fontes) => cb(fontes)),
  responderFonte: (id, audio) => ipcRenderer.send('fonte-escolhida', id, audio),
});
