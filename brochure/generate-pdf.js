const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123 });

  const htmlPath = path.resolve(__dirname, 'toprec-brochure.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.waitForFunction(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const pageCount = await page.evaluate(() => document.querySelectorAll('.page').length);
  console.log(`Found ${pageCount} page sections`);

  const pagePdfs = [];

  for (let i = 0; i < pageCount; i++) {
    await page.evaluate((idx) => {
      document.querySelectorAll('.page').forEach((el, j) => {
        el.style.display = j === idx ? '' : 'none';
      });
    }, i);

    await new Promise(r => setTimeout(r, 300));

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    pagePdfs.push(pdfBytes);
    console.log(`  Rendered page ${i + 1}/${pageCount}`);
  }

  const merged = await PDFDocument.create();

  for (const pdfBytes of pagePdfs) {
    const doc = await PDFDocument.load(pdfBytes);
    const [copiedPage] = await merged.copyPages(doc, [0]);
    merged.addPage(copiedPage);
  }

  const outputPath = path.resolve(__dirname, 'TOPREC_Admin_Portal_Brochure.pdf');
  const mergedBytes = await merged.save();
  fs.writeFileSync(outputPath, mergedBytes);

  console.log(`PDF generated: ${outputPath} (${pageCount} pages)`);
  await browser.close();
})();
