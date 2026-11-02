/* 舊作品、模式偏好與新版畫面的相容性。 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const page = await browser.newPage({viewport:{width:768,height:1024}});
  await page.goto('http://localhost:5181/#compose');
  await page.waitForFunction(()=>window.__rh);
  await page.screenshot({path:'docs/作曲-入門.png',fullPage:true});
  const result = await page.evaluate(async()=>{
    const store=await import('/js/store.js?v=6');
    const old={...store.newWork(),bars:4,tempo:160,notes:[{p:'C#6',d:2}]};
    delete old.composeMode;
    const restored=store.parseWorkFile(JSON.stringify(old))[0];
    window.__rh.compose.open(restored);
    return {mode:restored.composeMode,bars:restored.bars,tempo:restored.tempo,notes:restored.notes};
  });
  assert.deepEqual(result,{mode:'full',bars:4,tempo:160,notes:[{p:'C#6',d:2}]});
  assert.equal(await page.locator('#compose .tempo').inputValue(),'160');
  await page.locator('#compose .cmode').selectOption('starter');
  assert.equal(await page.evaluate(()=>window.__rh.compose.w.notes[0].p),'C#6');
  assert.equal(await page.locator('#compose .bars').inputValue(),'4');
  await page.locator('#compose .cmode').selectOption('full');
  await page.evaluate(async()=>{const s=await import('/js/store.js?v=6');window.__rh.compose.open(s.newWork());});
  assert.equal(await page.locator('#compose .bars').inputValue(),'8');
  assert.equal(await page.locator('#compose .cmode').inputValue(),'full');
  await page.screenshot({path:'docs/作曲-完整版.png',fullPage:true});
  await page.reload();await page.waitForFunction(()=>window.__rh);
  assert.equal(await page.locator('#compose .cmode').inputValue(),'full');
  assert.equal(await page.locator('#compose .bars').inputValue(),'8');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  console.log('舊作品、模式記憶與八小節相容性通過');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
