/* 本機瀏覽器驗證：執行時以 NODE_PATH 指向可用的 playwright。 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 768, height: 1024 }, acceptDownloads: true });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:5181/');
  await page.waitForFunction(() => window.__rh);
  await page.reload();
  await page.reload();
  await page.waitForFunction(() => window.__rh);
  assert.equal(await page.locator('.sys').isVisible(), false);
  assert.equal(await page.locator('#chart .chart-grid .nbtn').count(), 27);
  assert.equal(await page.locator('#chart .nbtn.wait').count(), 0);
  const verified = await page.evaluate(async () => {
    const { NOTE, NOTES, LEVELS, levelNotes } = await import('/js/music.js?v=5');
    return {
      corrected: ['A#4','C#6','D6'].map(id => NOTE[id].finger.english),
      germanEmpty: NOTES.every(n => n.finger.german === null),
      ready: LEVELS.every(lv => levelNotes(lv, 'english').ready),
    };
  });
  assert.deepEqual(verified.corrected, [['1|1011000','1|1011010'],'h|1001100|1','h|101101h']);
  assert.equal(verified.germanEmpty, true);
  assert.equal(verified.ready, true);
  for (const id of ['F4', 'A#4', 'B4', 'C#5', 'C#6', 'D6']) {
    await page.locator(`#chart .chart-grid [data-id="${id}"]`).click();
    assert.equal(await page.locator('#chart .dstaff svg').count(), 1);
    if (['A#4','B4','C#5'].includes(id)) assert.equal(await page.locator('#chart .dfing figcaption').allTextContents().then(a=>a.join(',')), '指法 I,指法 II');
  }
  await page.screenshot({ path: 'docs/iPad-指法表.png', fullPage: true });
  await page.locator('[data-tab="memory"]').click();
  for (const id of ['full','semi']) assert.equal(await page.locator(`#memory [data-lv="${id}"]`).isDisabled(), false);
  for (const [id,count] of [['kangxuan',10],['hanlin',12],['full',16],['semi',27]]) {
    await page.locator('[data-tab="memory"]').click();
    assert.equal(await page.locator(`#memory [data-lv="${id}"]`).isDisabled(), false);
    await page.locator(`#memory [data-lv="${id}"]`).click();
    if (['kangxuan','hanlin'].includes(id)) assert.match(await page.locator('#memory .level-preview').innerText(), /進度暫定，待老師確認/);
    assert.equal(await page.locator('#memory .keys .nbtn').count(),count);
    assert.equal(await page.locator('#memory .keys .nbtn.wait').count(),0);
    await page.locator('#memory .go').click();
    await page.waitForFunction(()=>window.__rh.memory.listening);
    const seq=await page.evaluate(()=>window.__rh.memory.seq);
    for(const k of seq) await page.locator(`#memory .keys [data-k="${k}"]`).click();
    assert.match(await page.locator('#memory .msg').innerText(), /下一關多一個音/);
    await page.screenshot({path:`docs/iPad-${id}-記憶遊戲.png`,fullPage:true});
    await page.locator('[data-tab="quiz"]').click();
    await page.locator(`#quiz [data-lv="${id}"]`).click();
    for(const mode of ['f2n','s2f']) {
      await page.locator(`[data-qm="${mode}"]`).click();
      await page.locator('#quiz .go').click();
      assert.equal(await page.evaluate(()=>window.__rh.quiz.pool.length),count);
      if (['full','semi'].includes(id)) {
        // 實際顯示並作答新增 D6，確認兩種題型都能畫出指法與五線譜。
        await page.evaluate(() => {
          const q = window.__rh.quiz;
          q.qs[0] = q.pool.find(n => n.id === 'D6'); q.ask();
        });
      }
      const answer=await page.evaluate(()=>window.__rh.quiz.qs[0].id);
      await page.locator(`#quiz .qopts [data-id="${answer}"]`).click();
      assert.equal(await page.evaluate(()=>window.__rh.quiz.score),1);
    }
    await page.screenshot({path:`docs/iPad-${id}-小測驗.png`,fullPage:true});
  }
  await page.locator('[data-tab="memory"]').click();
  await page.locator('#memory [data-lv="starter"]').click();
  await page.locator('#memory .go').click();
  await page.waitForFunction(() => window.__rh.memory.listening);
  const sequence=await page.evaluate(()=>window.__rh.memory.seq);
  for(const k of sequence) await page.locator(`#memory .keys [data-k="${k}"]`).click();
  assert.match(await page.locator('#memory .msg').innerText(), /下一關多一個音/);
  await page.locator('[data-tab="quiz"]').click();
  await page.locator('#quiz [data-lv="starter"]').click();
  for (const mode of ['f2n','s2f']) {
    await page.locator(`[data-qm="${mode}"]`).click();
    await page.locator('#quiz .go').click();
    for(let i=0;i<10;i++) {
      const id = await page.evaluate(() => window.__rh.quiz.qs[window.__rh.quiz.i].id);
      await page.locator(`#quiz .qopts [data-id="${id}"]`).click();
      await page.waitForFunction(i => window.__rh.quiz.i>i, i);
    }
    assert.match(await page.locator('#quiz .msg').innerText(), /答對 10 \/ 10/);
  }
  await page.locator('[data-tab="compose"]').click();
  assert.equal(await page.locator('#compose .pitches .nbtn:not(.rest)').count(), 27);
  await page.locator('#compose [data-d="8"]').click();
  for(const id of ['A#4','C#6','D6','C5']) await page.locator(`#compose .pitches [data-id="${id}"]`).click();
  assert.match(await page.locator('#compose .status').innerText(), /小節都寫好了/);
  await page.locator('#compose .staff .abcjs-note').first().click();
  assert.match(await page.locator('#compose .status').innerText(), /已選第 1 個音/);
  await page.locator('#compose .pitches [data-id="D4"]').click();
  assert.equal(await page.evaluate(()=>window.__rh.compose.w.notes[0].p), 'D4');
  await page.locator('#compose .play').click();
  assert.match(await page.locator('#compose .play').innerText(), /停止/);
  await page.locator('#compose .play').click();
  await page.locator('#compose .savew').click();
  await page.screenshot({ path: 'docs/iPad-小作曲.png', fullPage: true });
  const audio = await page.evaluate(async () => {
    const r=window.__rh, events=r.compose.events();
    const mp3=await r.renderMp3(events,90), wav=await r.renderWav(events,90);
    const ac=new AudioContext();
    const decoded=await ac.decodeAudioData(await mp3.arrayBuffer());
    const decodedWav=await ac.decodeAudioData(await wav.arrayBuffer());
    const expected=16*60/90+0.8;
    await ac.close();
    return { mime:mp3.type,size:mp3.size,duration:decoded.duration,wavDuration:decodedWav.duration,expected };
  });
  assert.equal(audio.mime,'audio/mpeg');
  assert.ok(Math.abs(audio.duration-audio.expected)<0.1, JSON.stringify(audio));
  assert.ok(Math.abs(audio.wavDuration-audio.expected)<0.01);
  await page.locator('#compose .out').click();
  await page.locator('#outDlg [data-dl="mp3"]').waitFor();
  await page.screenshot({ path: 'docs/iPad-輸出.png', fullPage: true });
  const downloads={};
  for(const kind of ['mp3','png','wav','json']) {
    const waiting=page.waitForEvent('download');
    await page.locator(`#outDlg [data-dl="${kind}"]`).click();
    const download=await waiting;
    const target=path.resolve('docs',`測試作品.${kind}`);
    await download.saveAs(target); downloads[kind]=target;
    assert.ok(fs.statSync(target).size>100);
  }
  const image=await page.locator('#outDlg .preview img').evaluate(img=>({ width:img.naturalWidth,height:img.naturalHeight }));
  assert.ok(image.width>0);
  const all=[]; const listener=d=>all.push(d.suggestedFilename()); page.on('download',listener);
  await page.locator('#outDlg [data-dl="all"]').click();
  await page.waitForTimeout(600);
  page.off('download',listener);
  assert.equal(all.length,3); assert.ok(!all.some(n=>n.endsWith('.wav')));
  await page.locator('#outDlg .close').click();
  await page.locator('[data-tab="works"]').click();
  const imported=JSON.parse(fs.readFileSync(downloads.json,'utf8')); imported.id='驗證匯入作品';
  await page.locator('#works input[type="file"]').setInputFiles({name:'驗證作品.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
  await page.waitForFunction(()=>document.querySelectorAll('#works .wlist li').length>=2);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false);
  // 舊德式偏好與草稿必須仍可開啟，並固定回英式。
  await page.evaluate(()=>{ const db=window.__rh.db; db.prefs.system='german'; db.draft.system='german'; localStorage.setItem('recorder-helper:v1',JSON.stringify(db)); });
  await page.reload(); await page.waitForFunction(()=>window.__rh);
  assert.equal(await page.evaluate(()=>window.__rh.db.prefs.system),'english');
  await page.locator('[data-tab="compose"]').click();
  assert.equal(await page.evaluate(()=>window.__rh.compose.w.system),'english');
  // 產生自行繪製的指法對照圖，不含課本掃描。
  const svg = await page.evaluate(async () => {
    const {NOTES,fingersOf,fingerSVG,label}=await import('/js/music.js?v=5');
    const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
    const cells=NOTES.map((n,i)=>{
      const x=20+(i%9)*155,y=90+Math.floor(i/9)*340, fs=fingersOf(n,'english');
      return `<g transform="translate(${x},${y})"><text x="70" y="15" text-anchor="middle" font-size="17">${esc(label(n))}</text><text x="70" y="38" text-anchor="middle" font-size="14">${esc(n.name)} (${n.id})</text>${(fs.length?fs:[null]).map((f,j)=>`<svg x="${fs.length>1?j*70:35}" y="50" width="70" height="220" viewBox="0 0 64 176">${fingerSVG(f,{showNums:true}).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>${fs.length>1?`<text x="${35+j*70}" y="292" text-anchor="middle" font-size="15">指法 ${j?'II':'I'}</text>`:''}`).join('')}${!fs.length?'<text x="70" y="310" text-anchor="middle" fill="#b33" font-size="14">筆跡遮擋，待確認</text>':''}</g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1435" height="1150"><rect width="100%" height="100%" fill="white"/><g font-family="Microsoft JhengHei, sans-serif" fill="#1f3a4d"><text x="30" y="35" font-size="26">課本指法轉錄對照（英式）</text><text x="30" y="64" font-size="17">黑＝按住　白＝打開　拇指白縫＝留一細縫　雙孔一黑一白＝只按一孔　8＝蓋住笛尾</text>${cells}</g></svg>`;
  });
  fs.writeFileSync('docs/指法轉錄對照.svg',svg);
  const report=await context.newPage(); await report.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await report.setViewportSize({width:1435,height:1150});
  await report.screenshot({path:'docs/指法轉錄對照.png',fullPage:true});
  const worker=await page.evaluate(async()=>{await navigator.serviceWorker.ready;const keys=await caches.keys();return {keys,files:await (await caches.open('rh-v5')).keys().then(a=>a.map(r=>r.url))};});
  assert.ok(worker.keys.includes('rh-v5'));assert.ok(worker.files.some(u=>u.includes('lame.min.js')));
  await context.setOffline(true);
  await page.reload();await page.waitForFunction(()=>window.__rh);
  assert.equal(await page.evaluate(()=>typeof window.lamejs.Mp3Encoder),'function');
  assert.equal(await page.evaluate(async () => (await import('/js/music.js?v=5')).NOTE.D6.finger.english), 'h|101101h');
  await context.setOffline(false);
  const privatePage=await browser.newPage();
  await privatePage.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('測試封鎖儲存');}});});
  await privatePage.goto('http://localhost:5181/');await privatePage.waitForFunction(()=>window.__rh);
  assert.equal(await privatePage.locator('#chart .chart-grid .nbtn').count(),27);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({audio,image,all,worker:worker.keys,errors,result:'通過'},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
