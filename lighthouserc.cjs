const basePath = (process.env.BASE_PATH ?? '/').replace(/\/+$/, '');
const page = (path) => `http://127.0.0.1:4321${basePath}${path}`;

module.exports = {
  ci: {
    collect: {
      chromePath: process.env.CHROME_PATH,
      startServerCommand: 'npm run preview -- --host 127.0.0.1 --port 4321',
      startServerReadyPattern: 'Local',
      url: [page('/'), page('/articles/'), page('/about/')],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
