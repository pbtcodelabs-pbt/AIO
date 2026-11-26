// دو فون + نقلی Firestore: ایک ساتھ بل/وصولی/اوپننگ/ایڈٹ — آخر میں دونوں پر ہر گاہک کا بقایا ماڈل کے برابر
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [dir, seedArg, roundsArg, legacy] = process.argv.slice(2); const LOSSY = process.env.LOSSY || '0';
let seed = +seedArg || 1; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const docs = new Map(); let tick = 0;
function fakeFS(method, p, body){
  const [pth, q] = p.split('?'); const name = pth.split('/store/')[1]; const qs = new URLSearchParams(q || '');
  const cur = docs.get(name);
  if(method === 'GET'){ if(!cur) return {status: 404, json: {}}; return {status: 200, json: {fields: cur.fields, updateTime: cur.ut}}; }
  const b = JSON.parse(body || '{}');
  const ut = qs.get('currentDocument.updateTime'), ex = qs.get('currentDocument.exists'), mask = qs.getAll('updateMask.fieldPaths');
  if(ut && (!cur || cur.ut !== ut)) return {status: 400, json: {error: {status: 'FAILED_PRECONDITION'}}};
  if(ex === 'false' && cur) return {status: 409, json: {error: {status: 'ALREADY_EXISTS'}}};
  const nut = new Date(Date.UTC(2026, 0, 1) + (++tick)).toISOString().replace('Z', '123Z');
  const fields = mask.length ? Object.assign({}, cur ? cur.fields : {}, ...mask.map(k => ({[k]: b.fields[k]}))) : b.fields;
  docs.set(name, {fields, ut: nut});
  return {status: 200, json: {fields, updateTime: nut}};
}
(async () => {
  const srv = http.createServer((q, r) => { let p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, {'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript'}); r.end(d); } }); }).listen(0);
  const b = await chromium.launch();
  const mk = async (slot) => {
    const ctx = await b.newContext(); const pg = await ctx.newPage();
    pg.on('dialog', d => d.accept()); pg.on('pageerror', e => console.log('ERR' + slot, e.message.slice(0, 120)));
    await pg.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    await pg.exposeFunction('fakeFS', fakeFS);
    await pg.goto(`http://127.0.0.1:${srv.address().port}/index.html`); await pg.waitForTimeout(2200);
    try{ await pg.getByRole('button', {name: /^Enter$/}).first().click({timeout: 2000}); }catch(e){}
    await pg.waitForTimeout(1000);
    await pg.evaluate((slot) => {
      window.alert = () => {}; window.confirm = () => true;
      try{ showImageSharePreview = () => {}; openInvoicePreview = () => {}; sharePaymentReceiptImage = async () => {}; }catch(e){}
      aioAuthFetch = async (p, o = {}) => { const r = await window.fakeFS(o.method || 'GET', p, o.body || null); if(window.__lossy && (o.method || 'GET') === 'PATCH' && !/_index/.test(p) && (!window.__lossyRx || new RegExp(window.__lossyRx).test(p)) && r.status < 300 && Math.random() < window.__lossy) throw new Error('lost reply'); return {status: r.status, ok: r.status < 300, json: async () => r.json}; };   /* LOSSY: کلاؤڈ پر لکھ گیا مگر جواب نہیں آیا */
      Object.assign(AppState.settings, {syncOn: true, businessId: 'BIZ-TEST-0000-0001', syncSlot: slot, syncRole: slot ? 'staff' : 'owner', trackInventory: false, taxEnabled: false});
      refreshMultiFlag();
      try{ clearInterval(syncPollTimer); }catch(e){}
      document.querySelectorAll('.modalOverlay.show').forEach(m => m.classList.remove('show')); goTo('billing');
    }, slot);
    await pg.evaluate(l => { window.__lossy = +l || 0; }, LOSSY);
    return pg;
  };
  const A = await mk(0), B = await mk(1);
  const sync = async pg => { for(let i = 0; i < 4; i++){ await pg.evaluate(async () => { await syncNow(); }); await pg.waitForTimeout(80); const busy = await pg.evaluate(() => syncBusy || syncAgain); if(!busy) break; await pg.waitForTimeout(700); } };
  if(legacy){ // پرانی v3 کلاؤڈ ترتیب پہلے سے موجود: ایک پرانا گاہک v3 ڈبے میں
    docs.set('customers__v3_b1', {fields: {json: {stringValue: JSON.stringify([{customer_id: 555, name: 'OLD', total_receivable: 999, wallet_balance: 0, walletHistory: []}])}}, ut: 'x'});
    docs.set('_index', {fields: {customers__v3_b1: {integerValue: '1'}}, ut: 'y'});
  }
  // گاہک اور پراڈکٹ A پر
  await A.evaluate(() => {
    for(let i = 1; i <= 3; i++) customersData.push({customer_id: 7700 + i, name: 'FZ' + i, phone: '030000000' + i, wallet_balance: 0, total_receivable: 0, walletHistory: []});
    productsData.push({product_id: 901, name: 'Cheeni', category: 'G', variants: [{variant_id: 9001, label: '1 kg', barcode: '', purchase: 1, retail: 160, wholesale: 160, stock: 100000, lowStockAt: 5, location: '', image: null, expiryDate: '', batches: []}]});
    persistAllData();
  });
  await sync(A); await sync(B);
  // AIO2611TH: ایک ہی منظر — A بل بناتا ہے، کلاؤڈ پر لکھ جاتا ہے مگر جواب گم؛ پھر عام سنک — بقایا دگنا نہیں ہونا چاہیے
  const bal = pg => pg.evaluate(() => customersData.find(c => c.customer_id === 7701).total_receivable);
  await A.evaluate(() => { const sel = document.getElementById('customerSelect'); populateCustomerDropdown(); sel.value = '7701'; onCustomerChange();
    Billing.cart = []; addToCart(9001); Billing.cart[0].qty = 1; Billing.cart[0].unitPrice = 8040; renderCart(); document.getElementById('amountReceivedInput').value = ''; renderCart(); finalizeInvoice(); });
  await A.evaluate(() => { window.__lossy = 1; window.__lossyRx = 'customers'; });
  await A.evaluate(async () => { try{ await syncNow(); }catch(e){} }); await A.waitForTimeout(600);
  await A.evaluate(() => { window.__lossy = 0; });
  for(const pg of [A, B, A, B, A]) { await sync(pg); await pg.waitForTimeout(300); }
  const a = await bal(A), bb = await bal(B);
  console.log((a === 8040 && bb === 8040 ? 'ECHO OK' : 'ECHO FAIL') + ` A=${a} B=${bb} (درست 8040)`);
  await b.close(); srv.close();
})();
