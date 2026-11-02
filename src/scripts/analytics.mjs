export const goatCounterOrigin = 'https://roroche.goatcounter.com';
const productionHostname = 'roroche.github.io';

export function initializeAnalytics(browser = window) {
  // Production output can also be previewed locally: never count those visits.
  if (browser.location.hostname !== productionHostname) return;

  const document = browser.document;
  if (document.querySelector('script[data-goatcounter]')) return;

  const tracker = document.createElement('script');
  tracker.src = 'https://gc.zgo.at/count.js';
  tracker.async = true;
  tracker.dataset.goatcounter = `${goatCounterOrigin}/count`;
  document.head.appendChild(tracker);

  for (const counter of document.querySelectorAll('[data-visit-count]')) {
    const path = counter.dataset.visitCount;
    if (!path) continue;

    browser
      .fetch(`${goatCounterOrigin}/counter/${encodeURIComponent(path)}.json`, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(5000),
      })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (
          typeof data.count !== 'string' ||
          !/^[0-9][0-9,.\s]*$/.test(data.count)
        )
          return;
        counter.textContent = `${data.count} visits`;
        counter.hidden = false;
      })
      // New articles, private counters and blocked requests have no public count.
      .catch(() => {});
  }
}
