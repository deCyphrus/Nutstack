import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  console.log("Root element HTML length:", (await page.$('#root')) ? (await page.$eval('#root', el => el.innerHTML)).length : 0);
  
  await page.screenshot({ path: 'preview_check.png' });
  await browser.close();
})();
