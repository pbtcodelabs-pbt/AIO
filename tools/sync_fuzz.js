// دو فون + نقلی Firestore: ایک ساتھ بل/وصولی/اوپننگ/ایڈٹ — آخر میں دونوں پر ہر گاہک کا بقایا ماڈل کے برابر
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [dir, seedArg, roundsArg, legacy] = process.argv.slice(2);
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
      aioAuthFetch = async (p, o = {}) => { const r = await window.fakeFS(o.method || 'GET', p, o.body || null); return {status: r.status, ok: r.status < 300, json: async () => r.json}; };
      Object.assign(AppState.settings, {syncOn: true, businessId: 'BIZ-TEST-0000-0001', syncSlot: slot, syncRole: slot ? 'staff' : 'owner', trackInventory: false, taxEnabled: false});
      refreshMultiFlag();
      try{ clearInterval(syncPollTimer); }catch(e){}
      document.querySelectorAll('.modalOverlay.show').forEach(m => m.classList.remove('show')); goTo('billing');
    }, slot);
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
  const N = {7701: 0, 7702: 0, 7703: 0};
  const op = async (pg, tag) => {
    const k = ri(0, 3), cid = 7701 + ri(0, 2);
    if(k === 0){ // ادھار بل
      const G = ri(1, 50) * 100, R = ri(0, 2) ? 0 : ri(1, G / 100) * 100;
      const ok = await pg.evaluate(({cid, G, R}) => { const sel = document.getElementById('customerSelect'); populateCustomerDropdown(); sel.value = String(cid); onCustomerChange();
        Billing.cart = []; addToCart(9001); Billing.cart[0].qty = 1; Billing.cart[0].unitPrice = G; renderCart(); document.getElementById('amountReceivedInput').value = R || ''; renderCart();
        const c = customersData.find(x => x.customer_id === cid); const comb = c.total_receivable + G - Math.min(c.wallet_balance || 0, G);
        if(R > comb) return null; const n = invoicesData.length; finalizeInvoice(); return invoicesData.length > n; }, {cid, G, R});
      if(ok){ N[cid] += G - R; const id = await pg.evaluate(() => invoicesData[0].invoice_id + ' ' + invoicesData[0].invoice_no); return `${tag} bill ${cid} ${G}-${R} id=${id}`; } return `${tag} skip`;
    }
    if(k === 1){ // وصولی
      const A2 = ri(1, 30) * 100;
      const done = await pg.evaluate(({cid, A2}) => { const c = customersData.find(x => x.customer_id === cid); if(!(c.total_receivable > 0)) return false; openCollectModal(cid); setCollectMode('cash'); document.getElementById('collectAmount').value = A2; saveCollectReceivable(); return true; }, {cid, A2});
      if(done){ N[cid] -= A2; return `${tag} collect ${cid} ${A2}`; } return `${tag} skip`;
    }
    if(k === 2){ const X = ri(1, 30) * 100, rec = ri(0, 1);
      await pg.evaluate(({cid, X, rec}) => { openOpeningBalanceModal(cid, 'customers'); setOpeningBalanceType(rec ? 'recv' : 'pay'); document.getElementById('obAmount').value = X; saveOpeningBalanceAdjustment(); }, {cid, X, rec});
      N[cid] += rec ? X : -X; return `${tag} opening ${cid} ${rec ? '+' : '-'}${X}`; }
    // اپنے بنائے ہوئے کسی بل کا ایڈٹ
    const r = await pg.evaluate(() => { const own = invoicesData.filter(i => i.status !== 'voided' && i.customer_id && Math.floor(i.invoice_id / 1e6) === (AppState.settings.syncSlot || 0) * 0 + Math.floor(i.invoice_id / 1e6));
      const mine = own.filter(i => i.sold_by === AppState.currentUser?.name && !i.__x); if(!mine.length) return null; const inv = mine[0];
      const G0 = inv.grand_total, C0 = inv.cash_received_now || 0; startEditBill(inv.invoice_id); const G1 = G0 + 500; Billing.cart[0].unitPrice = G1; Billing.cart[0].qty = 1; renderCart();
      document.getElementById('amountReceivedInput').value = C0 || ''; renderCart(); finalizeInvoice(); return {cid: inv.customer_id, d: G1 - G0, id: inv.invoice_no}; });
    if(r){ N[r.cid] += r.d; return `${tag} edit ${r.id} +${r.d}`; } return `${tag} skip`;
  };
  const rounds = +roundsArg || 30; const log = [];
  for(let rd = 0; rd < rounds; rd++){
    for(let j = ri(0, 2); j > 0; j--) log.push(await op(A, 'A'));
    for(let j = ri(0, 2); j > 0; j--) log.push(await op(B, 'B'));
    const order = ri(0, 1) ? [A, B, A, B] : [B, A, B, A];
    for(const pg of order) await sync(pg);
    const st = async pg => pg.evaluate(() => ({N: Object.fromEntries(customersData.filter(c => c.customer_id > 7700 && c.customer_id < 7710).map(c => [c.customer_id, Math.round((c.total_receivable - c.wallet_balance) * 100) / 100])), inv: invoicesData.filter(i => i.status !== 'voided').length, err: window.__cloudSyncError || ''}));
    const a = await st(A), bb = await st(B);
    const bad = Object.keys(N).filter(k => Math.abs(a.N[k] - N[k]) > .01 || Math.abs(bb.N[k] - N[k]) > .01);
    if(bad.length || a.inv !== bb.inv){ console.log(`SEED ${seedArg} FAIL round ${rd}: model ${JSON.stringify(N)} A ${JSON.stringify(a)} B ${JSON.stringify(bb)}\n` + log.join('\n')); process.exitCode = 1; break; }
  }
  if(!process.exitCode){
    const chunks = [...docs.keys()].filter(k => k !== '_index'); const big = Math.max(...chunks.map(k => (docs.get(k).fields.json?.stringValue || '').length));
    console.log(`SEED ${seedArg}: ${rounds} rounds OK, ${log.filter(l => !/skip/.test(l)).length} ops; chunks ${chunks.length}: ${chunks.filter(c => /customers|products/.test(c)).slice(0, 6).join(',')}; biggest ${big} bytes` + (legacy ? `; old v3 customer on A: ${await A.evaluate(() => customersData.some(c => c.customer_id === 555))}` : ''));
  }
  await b.close(); srv.close();
})();
