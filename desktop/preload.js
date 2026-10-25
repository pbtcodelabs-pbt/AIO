// ===================== ونڈوز پروگرام اور ویب ایپ کے درمیان پل =====================
// ایپ کا window.print() یہاں پکڑا جاتا ہے — پرنٹ بغیر کسی پوچھے سیدھا پرنٹر پر (Silent Print آن ہو تو)
const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('aioDesktop', {
  isDesktop: true,
  print: () => ipcRenderer.invoke('aio-print'),
  printers: () => ipcRenderer.invoke('aio-printers'),
  settings: () => ipcRenderer.invoke('aio-settings')
});

webFrame.executeJavaScript(`(function(){
  if(window.__aioPrintPatched) return; window.__aioPrintPatched = true;
  var nativePrint = window.print.bind(window);
  window.print = function(){
    if(!window.aioDesktop){ nativePrint(); return; }
    try{ window.dispatchEvent(new Event('beforeprint')); }catch(e){}
    window.aioDesktop.print().catch(function(){}).finally(function(){
      setTimeout(function(){ try{ window.dispatchEvent(new Event('afterprint')); }catch(e){} }, 300);
    });
  };
})();`);
