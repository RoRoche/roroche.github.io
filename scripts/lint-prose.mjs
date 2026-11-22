import { readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import matter from 'gray-matter';

const articlesDirectory = resolve('src/content/articles');
const articles = [];

async function collectPublishedArticles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectPublishedArticles(path);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const { data } = matter.read(path);
      if (data.draft !== true) articles.push(path);
    }
  }
}

await collectPublishedArticles(articlesDirectory);

if (articles.length === 0) {
  console.log('No published articles to lint.');
} else {
  const result = spawnSync(
    process.execPath,
    [resolve('node_modules/textlint/bin/textlint.js'), ...articles],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
