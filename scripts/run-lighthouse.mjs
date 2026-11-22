import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const result = spawnSync('lhci', ['autorun'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CHROME_PATH: chromium.executablePath(),
  },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
