import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 1000));
  
  // click settings button
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.innerHTML.includes('lucide-settings')) {
        btn.click();
        break;
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'settings.png' });
  await browser.close();
  console.log("Screenshot saved.");
})();
