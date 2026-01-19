const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // The report is generated at out/test/reports/test-results.html
    const reportPath = path.resolve(__dirname, '..', 'out', 'test', 'reports', 'test-results.html');

    if (!fs.existsSync(reportPath)) {
        console.error(`Report file not found at ${reportPath}`);
        // We don't exit with error here because we might want to screenshot the failure state or just log it?
        // But if report is missing, we can't screenshot it.
        // Maybe mocha failed to generate it?
        process.exit(1);
    }

    console.log(`Loading report from ${reportPath}`);
    await page.goto(`file://${reportPath}`, { waitUntil: 'networkidle0' });

    // Set viewport to get a good width
    await page.setViewport({ width: 1280, height: 1024 });

    const screenshotPath = path.resolve(__dirname, '..', 'test-results.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`Screenshot saved to ${screenshotPath}`);

    await browser.close();
  } catch (error) {
    console.error('Failed to take screenshot:', error);
    process.exit(1);
  }
})();
