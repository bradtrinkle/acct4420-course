// Prints, as JSON, the saved-answer names on each page given: data-save fields, quiz ids (.qc), checkbox ids.
// Usage: node tools/saved_keys.js <siteRoot> <page.html> [<page.html> ...]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [root, ...pages] = process.argv.slice(2);
  const b = await chromium.launch(); const out = {};
  for (const p of pages) {
    const pg = await (await b.newContext()).newPage();
    await pg.goto('file://' + path.resolve(root, p)); await pg.waitForTimeout(400);
    out[p] = await pg.evaluate(() => [
      ...[...document.querySelectorAll('[data-save]')].map(e => 'f.' + e.dataset.save),
      ...[...document.querySelectorAll('.qc[data-id]')].map(e => 'qc.' + e.dataset.id),
    ].sort());
    await pg.context().close();
  }
  await b.close(); console.log(JSON.stringify(out));
})();
