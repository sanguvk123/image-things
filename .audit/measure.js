// Measures horizontal overflow on a rendered page.
// Run via: chrome --headless --dump-dom is not enough -- we need layout, so this
// is injected with --virtual-time-budget and printed to the console.
(() => {
  const doc = document.documentElement;
  const report = {
    clientWidth: doc.clientWidth,
    scrollWidth: doc.scrollWidth,
    overflows: doc.scrollWidth > doc.clientWidth,
    offenders: [],
  };

  if (report.overflows) {
    for (const el of document.querySelectorAll('*')) {
      const rect = el.getBoundingClientRect();
      if (rect.right > doc.clientWidth + 1) {
        report.offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 80),
          right: Math.round(rect.right),
          text: (el.textContent || '').trim().slice(0, 40),
        });
      }
    }
  }

  console.log('OVERFLOW_REPORT ' + JSON.stringify(report.offenders.slice(0, 8)));
  console.log('OVERFLOW_SUMMARY ' + JSON.stringify({
    clientWidth: report.clientWidth,
    scrollWidth: report.scrollWidth,
    overflows: report.overflows,
  }));
})();
