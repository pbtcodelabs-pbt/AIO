// پیسوں کا ایکسرے: بے ترتیب بل/ہولڈ/ایڈٹ/وصولی/واپسی/ڈیلیٹ/ری لوڈ — ہر قدم کے بعد آزاد کھاتے سے ملان
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [dir, seedArg, stepsArg, batchArg] = process.argv.slice(2);
const SEED = +seedArg || 1, STEPS = +stepsArg || 300, BATCH = +batchArg || 25;

const PAGE_FZ = function(args){
  const {steps, seed0} = args;
  window.alert = () => {}; window.confirm = () => true; window.prompt = () => '';
  try{ showImageSharePreview = () => {}; }catch(e){}
  try{ openInvoicePreview = () => {}; }catch(e){}
  try{ sharePaymentReceiptImage = async () => {}; }catch(e){}
  try{ renderReturnReceiptToCanvas = async () => document.createElement('canvas'); }catch(e){}
  const LS = 'fz_state';
  let S = JSON.parse(localStorage.getItem(LS) || 'null');
  const r2 = n => Math.round(n * 100) / 100;
  if(!S){
    AppState.settings.trackInventory = false; AppState.settings.taxEnabled = false;
    for(let i = 1; i <= 4; i++) customersData.push({customer_id: 7700 + i, name: 'FZ' + i, phone: '0300000000' + i, wallet_balance: 0, total_receivable: 0, walletHistory: []});
    for(let i = 1; i <= 2; i++) suppliersData.push({supplier_id: 7800 + i, name: 'SUP' + i, phone: '', total_payable: 0, purchaseHistory: [], ledgerHistory: []});
    persistAllData();
    S = {seed: seed0, N: {}, P: {7801: 0, 7802: 0}, stock: {}, cash: financeDummy.cashInHand, live: invoicesData.filter(i => i.status !== 'voided').length, step: 0, log: [], held: null};
    customersData.filter(c => c.customer_id > 7700 && c.customer_id < 7710).forEach(c => S.N[c.customer_id] = 0);
    [9001, 9002, 9003, 9004].forEach(v => S.stock[v] = findVariantById(v).stock);
  }
  const rnd = () => { S.seed = (S.seed * 1103515245 + 12345) % 2147483648; return S.seed / 2147483648; };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const custs = () => customersData.filter(c => c.customer_id > 7700 && c.customer_id < 7710);
  const C = id => customersData.find(c => c.customer_id === id);
  const actN = c => r2((Number(c.total_receivable) || 0) - (Number(c.wallet_balance) || 0));
  const sups = () => suppliersData.filter(x => x.supplier_id > 7800 && x.supplier_id < 7810);
  const SP = id => suppliersData.find(x => x.supplier_id === id);
  const stk = (items, sign, f) => (items || []).forEach(it => { if(S.stock[it.variant_id] != null) S.stock[it.variant_id] = Math.round((S.stock[it.variant_id] + sign * (f ? f(it) : it.qty)) * 1000) / 1000; });
  const liveInv = () => invoicesData.filter(i => i.status !== 'voided');
  const fail = (msg) => { S.log.push('FAIL: ' + msg); localStorage.setItem(LS, JSON.stringify(S)); throw new Error(msg + '\n' + S.log.slice(-12).join('\n')); };
  const check = (op) => {
    custs().forEach(c => {
      if(Math.abs(actN(c) - S.N[c.customer_id]) > 0.011) fail(`${op}: ${c.name} net app=${actN(c)} model=${S.N[c.customer_id]} (rec ${c.total_receivable}, wallet ${c.wallet_balance})`);
      if(c.total_receivable < -0.005) fail(`${op}: ${c.name} negative receivable ${c.total_receivable}`);
      if(c.wallet_balance < -0.005) fail(`${op}: ${c.name} negative wallet ${c.wallet_balance}`);
    });
    sups().forEach(x => { if(Math.abs((Number(x.total_payable) || 0) - S.P[x.supplier_id]) > 0.011) fail(`${op}: ${x.name} payable app=${x.total_payable} model=${S.P[x.supplier_id]}`); });
    Object.keys(S.stock).forEach(v => { const a = findVariantById(+v).stock; if(Math.abs(a - S.stock[v]) > 0.001) fail(`${op}: stock ${v} app=${a} model=${S.stock[v]}`); });
    if(Math.abs(financeDummy.cashInHand - S.cash) > 0.011) fail(`${op}: cash app=${financeDummy.cashInHand} model=${S.cash}`);
    if(liveInv().length !== S.live) fail(`${op}: bills app=${liveInv().length} model=${S.live}`);
    if(billEdit && !editingInvoice()) fail(`${op}: stale edit`);
  };
  const close = () => document.querySelectorAll('.modalOverlay.show').forEach(m => m.classList.remove('show'));
  // ---- کارٹ تیار کریں
  const fillCart = (cid, opts = {}) => {
    const sel = document.getElementById('customerSelect');
    populateCustomerDropdown();
    sel.value = cid ? String(cid) : ''; onCustomerChange();
    if(!opts.keepItems){
      Billing.cart = [];
      const n = ri(1, 3), vids = [9001, 9002, 9003, 9004];
      for(let k = 0; k < n; k++){ addToCart(vids[k]); const it = Billing.cart[Billing.cart.length - 1]; it.qty = ri(1, 4); it.unitPrice = ri(1, 60) * 50; }
    } else if(rnd() < .5 && Billing.cart.length){ const it = pick(Billing.cart); it.qty = ri(1, 5); it.unitPrice = ri(1, 60) * 50; }
    renderCart();
    const sub = r2(Billing.cart.reduce((s, i) => s + i.qty * i.unitPrice, 0));
    const disc = rnd() < .25 ? Math.min(sub, ri(1, 20) * 10) : 0;
    document.getElementById('discountInput').value = disc;
    const G = r2(sub - disc);
    const c = cid ? C(cid) : null;
    let R;
    if(!c) R = pick(['', String(G), String(G + ri(1, 9) * 100)]);
    else {
      const due = (c.total_receivable || 0) + G;
      R = pick(['', '', String(ri(1, Math.max(1, Math.floor(G / 100))) * 100), String(G), String(Math.round(due)), String(Math.round(due) + ri(1, 20) * 100)]);
    }
    document.getElementById('amountReceivedInput').value = R;
    const toW = !!c && rnd() < .4;
    document.getElementById('changeToWalletChk').checked = toW;
    renderCart();
    return {G, R: parseFloat(R) || 0, toW, items: Billing.cart.map(i => ({variant_id: i.variant_id, qty: i.qty}))};
  };
  // ---- نئے بل کا ماڈل (rec/wallet = اس وقت کی اصل قیمت، edit کے بعد کی)
  const modelBill = (cid, b, rec, wallet) => {
    stk(b.items, -1);
    if(!cid){ S.cash = r2(S.cash + b.G); return; }
    const W = wallet > 0 ? Math.min(wallet, b.G) : 0;
    const combRaw = rec + b.G - W, comb = Math.max(0, combRaw);
    const kept = b.R > comb ? (b.toW ? b.R : comb) : b.R;
    S.N[cid] = r2(S.N[cid] + b.G - kept);
    S.cash = r2(S.cash + kept);
  };
  const doFinalize = () => { const before = invoicesData.length, wasEdit = !!editingInvoice(); finalizeInvoice(); close(); return wasEdit ? !billEdit : invoicesData.length !== before; };

  const ops = {
    newBill(){
      const cid = rnd() < .2 ? null : pick(custs()).customer_id;
      const c = cid ? C(cid) : null; const rec = c ? c.total_receivable : 0, wal = c ? c.wallet_balance : 0;
      const b = fillCart(cid);
      if(doFinalize()){ modelBill(cid, b, rec, wal); S.live++; return `new ${cid || 'walk'} G=${b.G} R=${b.R} toW=${b.toW}`; }
      resetBillingCart(); return 'new skipped';
    },
    holdResume(){
      const cid = pick(custs()).customer_id;
      const b = fillCart(cid);
      holdCurrentBill(true);
      // بیچ میں دوسرا گاہک
      let mid = '';
      if(rnd() < .6){ const r = ops.newBill(); mid = ' | mid:' + r; }
      const h = heldBills[heldBills.length - 1];
      if(!h) fail('hold lost');
      const c = C(cid); const rec = c.total_receivable, wal = c.wallet_balance;
      resumeHeldBill(h.id);
      const R2 = parseFloat(document.getElementById('amountReceivedInput').value) || 0;
      if(Math.abs(R2 - b.R) > .001) fail(`resume lost received ${b.R} → ${R2}`);
      if(doFinalize()){ modelBill(cid, b, rec, wal); S.live++; return `hold ${cid} G=${b.G} R=${b.R}` + mid; }
      return 'hold skipped';
    },
    edit(){
      const cand = liveInv().filter(i => i.customer_id && custs().some(c => c.customer_id === i.customer_id) && !(i.items || []).some(it => it.returned));
      if(!cand.length) return 'edit none';
      const inv = pick(cand);
      const oldC = C(inv.customer_id);
      startEditBill(inv.invoice_id);
      if(rnd() < .2){ cancelEditBill(); return 'edit cancelled'; }
      const newCid = rnd() < .2 ? pick(custs()).customer_id : inv.customer_id;
      // ماڈل: پہلے پرانا بل واپس
      const oldItems = (inv.items || []).map(i => ({variant_id: i.variant_id, qty: i.qty}));
      const G0 = inv.grand_total, C0 = inv.cash_received_now || 0, W0 = inv.wallet_applied || 0, X0 = inv.change_credited_to_wallet || 0;
      const b = fillCart(newCid, {keepItems: newCid === inv.customer_id && rnd() < .7});
      // پرانے بل کے بغیر حالت (ایپ کا اپنا حساب مت لو — خود)
      const recO = oldC.total_receivable - (G0 - W0 - C0 + X0), walO = oldC.wallet_balance + W0 - X0;
      let rec, wal;
      if(newCid === oldC.customer_id){ rec = recO; wal = walO; } else { rec = C(newCid).total_receivable; wal = C(newCid).wallet_balance; }
      if(rnd() < .3){
        // ایڈٹ کے بیچ ہولڈ، دوسرا بل، پھر واپس
        holdCurrentBill(true);
        const mid = ops.newBill();
        if(newCid !== oldC.customer_id){ rec = C(newCid).total_receivable; wal = C(newCid).wallet_balance; }
        const recO2 = oldC.total_receivable - (G0 - W0 - C0 + X0), walO2 = oldC.wallet_balance + W0 - X0;
        if(newCid === oldC.customer_id){ rec = recO2; wal = walO2; }
        resumeHeldBill(heldBills[heldBills.length - 1].id);
        S.log.push('  (edit held, mid: ' + mid + ')');
      }
      if(!editingInvoice()) fail('edit context lost after hold/resume');
      if(newCid !== oldC.customer_id){ rec = C(newCid).total_receivable; wal = C(newCid).wallet_balance; }
      if(doFinalize()){
        stk(oldItems, +1);
        S.N[oldC.customer_id] = r2(S.N[oldC.customer_id] - (G0 - C0));
        S.cash = r2(S.cash - C0);
        modelBill(newCid, b, rec, wal);
        const ni = invoicesData.find(i => i.invoice_id === inv.invoice_id) || {};
        return `edit ${inv.invoice_no} ${oldC.customer_id}->${newCid} G ${G0}->${b.G} R=${b.R} | old C=${C0} W=${W0} X=${X0} | app G=${ni.grand_total} C=${ni.cash_received_now} W=${ni.wallet_applied} X=${ni.change_credited_to_wallet} chg=${ni.change_given} prev=${ni.previous_balance} model rec=${rec} wal=${wal}`;
      }
      fail('edit did not complete');
    },
    collect(){
      const c = pick(custs()); if(!(c.total_receivable > 0)) return 'collect none';
      const wallet = c.wallet_balance > 0 && rnd() < .3;
      openCollectModal(c.customer_id); setCollectMode(wallet ? 'wallet' : 'cash');
      const A = wallet ? Math.min(c.total_receivable, c.wallet_balance) : ri(1, Math.ceil(c.total_receivable * 1.3 / 100)) * 100;
      document.getElementById('collectAmount').value = A;
      saveCollectReceivable(); close();
      if(!wallet){ S.N[c.customer_id] = r2(S.N[c.customer_id] - A); S.cash = r2(S.cash + A); }
      return `collect ${c.customer_id} ${wallet ? 'wallet' : 'cash'} ${A}`;
    },
    recordPay(){
      const c = pick(custs());
      openRecordPaymentModal(); setRecordPaymentDirection('in');
      const A = ri(1, 30) * 100;
      document.getElementById('rpPartySelect').value = String(c.customer_id);
      document.getElementById('rpAmount').value = A;
      saveRecordPaymentModal(); close();
      S.N[c.customer_id] = r2(S.N[c.customer_id] - A); S.cash = r2(S.cash + A);
      return `recordPay ${c.customer_id} ${A}`;
    },
    ret(){
      const cand = liveInv().filter(i => (i.items || []).some(it => !it.returned) && (!i.customer_id || custs().some(c => c.customer_id === i.customer_id)) && i.invoice_id > 1e9);
      if(!cand.length) return 'ret none';
      const inv = pick(cand); const idx = inv.items.findIndex(it => !it.returned);
      const c = inv.customer_id ? C(inv.customer_id) : null;
      renderReturnItemModal(inv.invoice_id);
      document.getElementById('retChk_' + idx).checked = true; try{ toggleReturnRow(idx); }catch(e){}
      const q = ri(1, inv.items[idx].qty); document.getElementById('retQty_' + idx).value = q; try{ updateReturnRowTotal(idx); }catch(e){}
      const F = parseFloat(document.getElementById('retAmt_' + idx).value) || 0;
      const wallet = !!c && rnd() < .5;
      document.getElementById('retMethodWallet').checked = wallet; document.getElementById('retMethodCash').checked = !wallet;
      const due = c ? getInvoiceAmountDue(inv) : 0, rec = c ? c.total_receivable : 0;
      const off = c ? r2(Math.min(F, due, Math.max(0, rec))) : 0;
      confirmBatchReturn(inv.invoice_id); close();
      stk([{variant_id: inv.items[idx].variant_id, qty: q}], +1);
      if(!c){ S.cash = r2(S.cash - F); }
      else if(wallet){ S.N[c.customer_id] = r2(S.N[c.customer_id] - F); }
      else { S.N[c.customer_id] = r2(S.N[c.customer_id] - off); S.cash = r2(S.cash - (F - off)); }
      return `return ${inv.invoice_no} F=${F} ${wallet ? 'wallet' : 'cash'} off=${off}`;
    },
    void(){
      const cand = liveInv().filter(i => (!i.customer_id || custs().some(c => c.customer_id === i.customer_id)) && i.invoice_id > 1e9);
      if(!cand.length) return 'void none';
      const inv = pick(cand); const c = inv.customer_id ? C(inv.customer_id) : null;
      const hasRet = (inv.items || []).some(it => it.returned);
      const G = inv.grand_total, C0 = inv.cash_received_now || 0;
      const wasCounter = inv.payment_method === 'cash' && !(inv.cash_received_now > 0) && !(inv.wallet_applied > 0);
      const left = (inv.items || []).map(i => ({variant_id: i.variant_id, qty: i.qty - (i.returned ? (i.returnQty || 0) : 0)}));
      executeVoidBill(inv); persistAllData();
      stk(left, +1);
      S.live--;
      if(!c || wasCounter){ S.cash = r2(S.cash - G); }
      else if(hasRet){ S.N[c.customer_id] = r2(S.N[c.customer_id] - G); }
      else { S.N[c.customer_id] = r2(S.N[c.customer_id] - (G - C0)); S.cash = r2(S.cash - C0); }
      return `void ${inv.invoice_no} G=${G} ret=${hasRet}`;
    },
    opening(){
      const c = pick(custs()); const recv = rnd() < .5; const X = ri(1, 30) * 100;
      openOpeningBalanceModal(c.customer_id, 'customers'); setOpeningBalanceType(recv ? 'recv' : 'pay');
      document.getElementById('obAmount').value = X; saveOpeningBalanceAdjustment(); close();
      S.N[c.customer_id] = r2(S.N[c.customer_id] + (recv ? X : -X));
      return `opening ${c.customer_id} ${recv ? '+' : '-'}${X}`;
    },
    po(){
      const x = pick(sups());
      openPoModal(x.supplier_id); poCart = [];
      const n = ri(1, 3), vids = [9001, 9002, 9003, 9004];
      for(let k = 0; k < n; k++) poCart.push({variant_id: vids[k], name: 'v' + vids[k], qty: ri(1, 20), cost: ri(1, 40) * 25});
      savePurchaseOrder(); close();
      return `po ${x.supplier_id} total=${x.purchaseHistory[0].total}`;
    },
    receive(){
      const x = pick(sups()); const idx = (x.purchaseHistory || []).findIndex(p => p.status !== 'received');
      if(idx < 0) return 'receive none';
      openReceiveShipmentModal(x.supplier_id, idx);
      if(rnd() < .5 && receiveShipmentCart.length){ const it = pick(receiveShipmentCart); it.qty = ri(1, 25); it.cost = ri(1, 40) * 25; }
      const items = receiveShipmentCart.map(i => ({variant_id: i.variant_id, qty: i.qty}));
      const tot = r2(receiveShipmentCart.reduce((a, i) => a + i.qty * i.cost, 0));
      confirmShipmentReceipt(); close();
      S.P[x.supplier_id] = r2(S.P[x.supplier_id] + tot); stk(items, +1);
      return `receive ${x.supplier_id} ${tot}`;
    },
    editShip(){
      const x = pick(sups()); const idx = (x.purchaseHistory || []).findIndex(p => p.status === 'received' && !(p.items || []).some(i => i.returned));
      if(idx < 0) return 'editShip none';
      const po = x.purchaseHistory[idx]; const old = po.total; const oldItems = po.items.map(i => ({variant_id: i.variant_id, qty: i.qty}));
      openEditReceivedShipment(x.supplier_id, idx);
      if(receiveShipmentCart.length){ const it = pick(receiveShipmentCart); it.qty = ri(1, 25); it.cost = ri(1, 40) * 25; }
      const items = receiveShipmentCart.map(i => ({variant_id: i.variant_id, qty: i.qty}));
      const tot = r2(receiveShipmentCart.reduce((a, i) => a + i.qty * i.cost, 0));
      confirmShipmentReceipt(); close();
      S.P[x.supplier_id] = r2(S.P[x.supplier_id] + tot - old); stk(oldItems, -1); stk(items, +1);
      return `editShip ${x.supplier_id} ${old}->${tot}`;
    },
    supReturn(){
      const x = pick(sups()); const idx = (x.purchaseHistory || []).findIndex(p => p.status === 'received' && p.items.some(i => !i.returned));
      if(idx < 0) return 'supReturn none';
      const po = x.purchaseHistory[idx]; const ii = po.items.findIndex(i => !i.returned);
      openSupplierReturnModal(x.supplier_id, idx);
      const q = ri(1, po.items[ii].qty), F = ri(0, 40) * 25;
      document.getElementById('supRetQty_' + ii).value = q; document.getElementById('supRetAmt_' + ii).value = F;
      confirmSupplierReturn(ii); close();
      S.P[x.supplier_id] = r2(S.P[x.supplier_id] - F); stk([{variant_id: po.items[ii].variant_id, qty: q}], -1);
      return `supReturn ${x.supplier_id} q=${q} F=${F}`;
    },
    paySup(){
      const x = pick(sups()); const A = ri(1, 60) * 100;
      if(rnd() < .5){
        openPaySupplierModal(x.supplier_id); document.getElementById('paySupplierAmount').value = A; confirmPaySupplier(); close();
      } else {
        openRecordPaymentModal(); setRecordPaymentDirection('out'); document.getElementById('rpPartySelect').value = String(x.supplier_id);
        document.getElementById('rpAmount').value = A; saveRecordPaymentModal(); close();
      }
      S.P[x.supplier_id] = r2(S.P[x.supplier_id] - A); S.cash = r2(S.cash - A);
      return `paySup ${x.supplier_id} ${A}`;
    },
    supOpening(){
      const x = pick(sups()); const recv = rnd() < .5; const X = ri(1, 30) * 100;
      openOpeningBalanceModal(x.supplier_id, 'suppliers'); setOpeningBalanceType(recv ? 'recv' : 'pay');
      document.getElementById('obAmount').value = X; saveOpeningBalanceAdjustment(); close();
      S.P[x.supplier_id] = r2(S.P[x.supplier_id] + (recv ? -X : X));
      return `supOpening ${x.supplier_id} ${recv ? '-' : '+'}${X}`;
    },
    delPo(){
      const x = pick(sups()); const idx = (x.purchaseHistory || []).findIndex(p => p.status !== 'received');
      if(idx < 0) return 'delPo none';
      deletePendingPurchaseOrder(x.supplier_id, idx); close(); return `delPo ${x.supplier_id}`;
    },
    cartLeft(){
      // کارٹ میں رقم لکھ کر چھوڑ دیں — اگلی ری لوڈ کے بعد بھی وہی رہے
      const cid = pick(custs()).customer_id;
      const b = fillCart(cid); S.pendingCart = {cid, b, rec: C(cid).total_receivable, wal: C(cid).wallet_balance};
      saveBillingCartDraft();
      return `cartLeft ${cid} G=${b.G} R=${b.R}`;
    },
  };
  const weights = [['newBill', 5], ['holdResume', 2], ['edit', 3], ['collect', 3], ['recordPay', 1], ['ret', 2], ['void', 1], ['opening', 1], ['cartLeft', 1], ['po', 2], ['receive', 2], ['editShip', 1], ['supReturn', 1], ['paySup', 2], ['supOpening', 1], ['delPo', 1]];
  const total = weights.reduce((s, w) => s + w[1], 0);
  const out = [];
  // ری لوڈ کے بعد چھوڑا ہوا کارٹ مکمل کریں
  if(S.pendingCart){
    const pc = S.pendingCart; S.pendingCart = null;
    openCartSheet();
    const R2 = parseFloat(document.getElementById('amountReceivedInput').value) || 0;
    const sel = document.getElementById('customerSelect').value;
    if(String(sel) !== String(pc.cid)) fail(`reload lost customer ${pc.cid} → '${sel}'`);
    if(Math.abs(R2 - pc.b.R) > .001) fail(`reload lost received ${pc.b.R} → ${R2}`);
    const c = C(pc.cid);
    S.log.push(`  reload: edit=${JSON.stringify(billEdit)} rec=${c.total_receivable} wal=${c.wallet_balance} toW=${document.getElementById('changeToWalletChk').checked} disc=${document.getElementById('discountInput').value} cart=${Billing.cart.length}`);
    const L0 = invoicesData.length, rec0 = c.total_receivable, wal0 = c.wallet_balance; const ok = doFinalize();
    S.log.push(`  reload fin ok=${ok} len ${L0}->${invoicesData.length} rec=${C(pc.cid).total_receivable} qcc=${document.getElementById('quickCreditCustomerModal').classList.contains('show')}`);
    if(ok){ modelBill(pc.cid, pc.b, rec0, wal0); S.live++; }
    check('after reload cart'); out.push('reload-cart ok');
  }
  for(let k = 0; k < steps; k++){
    S.step++;
    if(billEdit){ cancelEditBill(); }
    if(Billing.cart.length && !S.pendingCart) resetBillingCart();
    let x = rnd() * total, name = weights[0][0];
    for(const [n, w] of weights){ if((x -= w) < 0){ name = n; break; } }
    let res;
    try{ res = ops[name](); }catch(e){ if(String(e.message).startsWith('FAIL') || S.log.some(l => l.startsWith('FAIL'))) throw e; fail(`${name} threw: ${e.message}\n${(e.stack||'').split('\n').slice(0,3).join('\n')}`); }
    S.log.push(`#${S.step} ${res}`); if(S.log.length > 60) S.log.shift();
    check(`#${S.step} ${res}`);
    out.push(res);
    if(name === 'cartLeft') break; // ری لوڈ باہر سے
  }
  persistAllData();
  localStorage.setItem(LS, JSON.stringify(S));
  return {step: S.step, pending: !!S.pendingCart, last: out.slice(-3)};
};

(async () => {
  const srv = http.createServer((q, r) => { let p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
    fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, {'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript'}); r.end(d); } }); }).listen(0);
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 400, height: 800}}); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('dialog', d => d.accept());
  await pg.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  const url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const login = async (first) => {
    await pg.goto(url); await pg.waitForTimeout(2200);
    try{ await pg.getByRole('button', {name: /^Enter$/}).first().click({timeout: 2000}); }catch(e){}
    await pg.waitForTimeout(1200);
    if(first) await pg.evaluate(() => {
      const mk = (id, l, pu, r, st) => ({variant_id: id, label: l, barcode: '', purchase: pu, retail: r, wholesale: r, stock: st, lowStockAt: 5, location: '', image: null, expiryDate: '', batches: []});
      productsData.push({product_id: 901, name: 'Cheeni', category: 'Grocery', variants: [mk(9001, '1 kg', 140, 160, 100000), mk(9002, '2 kg', 145, 170, 100000), mk(9003, '500 g', 75, 90, 100000), mk(9004, '250 g', 38, 45, 100000)]});
      persistAllData();
    });
    await pg.evaluate(() => { document.querySelectorAll('.modalOverlay.show').forEach(m => m.classList.remove('show')); goTo('billing'); });
  };
  await login(true);
  let done = 0, reloads = 0;
  try{
    while(done < STEPS){
      const r = await pg.evaluate(PAGE_FZ, {steps: BATCH, seed0: SEED});
      done = r.step;
      if(r.pending || Math.random() < .3){ await pg.waitForTimeout(300); await login(false); reloads++; }
    }
    console.log(`SEED ${SEED}: ${done} steps OK, ${reloads} reloads`, errs.length ? 'pageerrors: ' + errs.slice(0, 3).join(' | ') : '');
  }catch(e){
    console.log(`SEED ${SEED}: FAILED\n` + e.message.split('\n').slice(0, 30).join('\n'));
    process.exitCode = 1;
  }
  await b.close(); srv.close();
})();
