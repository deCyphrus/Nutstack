import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:3000');
  
  // Set localStorage
  await page.evaluate(() => {
    localStorage.setItem('nb_bg_color_v1', '#ffc0cb');
  });
  
  // Reload page
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log("HTML length:", html.length);
  await browser.close();
})();
