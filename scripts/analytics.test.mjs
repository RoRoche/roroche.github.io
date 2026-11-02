import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { initializeAnalytics } from '../src/scripts/analytics.mjs';

function fixture(hostname, response = Response.json({ count: '1,234' })) {
  const scripts = [];
  const requests = [];
  const counter = {
    dataset: { visitCount: '/articles/an-article/' },
    hidden: true,
    textContent: '',
  };
  const browser = {
    location: { hostname },
    document: {
      querySelector: () => scripts[0] || null,
      querySelectorAll: () => [counter],
      createElement: () => ({ dataset: {} }),
      head: { appendChild: (script) => scripts.push(script) },
    },
    fetch: async (...args) => {
      requests.push(args);
      if (response instanceof Error) throw response;
      return response;
    },
  };
  return { browser, scripts, requests, counter };
}

test('local and alternate hosts never send analytics requests', () => {
  for (const host of [
    'localhost',
    '127.0.0.1',
    '192.168.1.2',
    'preview.example.com',
  ]) {
    const { browser, scripts, requests } = fixture(host);
    initializeAnalytics(browser);
    assert.equal(scripts.length, 0);
    assert.equal(requests.length, 0);
  }
});

test('production loads one asynchronous tracker and displays visits for the exact article path', async () => {
  const { browser, scripts, requests, counter } = fixture('roroche.github.io');
  initializeAnalytics(browser);
  initializeAnalytics(browser);
  await setImmediate();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].async, true);
  assert.equal(
    scripts[0].dataset.goatcounter,
    'https://roroche.goatcounter.com/count',
  );
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0][0],
    'https://roroche.goatcounter.com/counter/%2Farticles%2Fan-article%2F.json',
  );
  assert.equal(requests[0][1].credentials, 'omit');
  assert.equal(counter.textContent, '1,234 visits');
  assert.equal(counter.hidden, false);
});

test('missing, disabled, blocked or invalid counters stay hidden without invented totals', async () => {
  for (const response of [
    new Response(null, { status: 404 }),
    new Response(null, { status: 403 }),
    new Error('Blocked by browser'),
    Response.json({ count: '<script>untrusted</script>' }),
    Response.json({ count: null }),
    new Response('Invalid JSON'),
  ]) {
    const { browser, counter } = fixture('roroche.github.io', response);
    initializeAnalytics(browser);
    await setImmediate();
    assert.equal(counter.hidden, true);
    assert.equal(counter.textContent, '');
  }
});
