import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  access,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalize, syncArticles } from './sync-articles.mjs';

test('drafts stay private; publication requires a date and a permanent slug', () => {
  assert.equal(normalize({ status: 'draft' }, 'example'), null);
  assert.equal(
    normalize({ status: 'published', draft: true }, 'example'),
    null,
  );
  assert.equal(normalize({ status: 'draft', draft: false }, 'example'), null);
  assert.throws(
    () =>
      normalize(
        { title: 'Title', description: 'Text', status: 'published' },
        'example',
      ),
    /valid published_at/,
  );
  assert.throws(
    () =>
      normalize(
        {
          title: 'Title',
          description: 'Text',
          status: 'published',
          published_at: '2026-10-27',
        },
        '../escape',
      ),
    /slug/,
  );
  assert.equal(
    normalize(
      {
        title: 'Title',
        description: 'Text',
        status: 'published',
        published_at: '2026-10-27',
        tags: ['mutation-testing'],
      },
      'example',
    ).category,
    'testing',
  );
});

test('imports source layout, assets and base-aware links; removes stale publications', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'articles-test-'));
  try {
    const source = join(temp, '.external/source');
    const target = join(temp, 'site');
    const article = join(source, 'an-article');
    await mkdir(article, { recursive: true });
    await writeFile(join(article, 'header.png'), 'image-fixture');
    await writeFile(
      join(article, 'post.md'),
      '---\ntitle: A useful test\ndescription: A description\nstatus: published\npublished_at: 2026-10-27\ntags: [testing]\n---\n![Example](header.png)\n[External](https://example.com)',
    );
    assert.equal(await syncArticles(source, target, { base: '/website/' }), 1);
    const result = await readFile(
      join(target, 'src/content/articles/an-article.md'),
      'utf8',
    );
    assert.match(result, /\/website\/article-assets\/an-article\/header.png/);
    assert.match(result, /https:\/\/example.com/);
    await access(join(target, 'public/article-assets/an-article/header.png'));
    await writeFile(
      join(article, 'post.md'),
      '---\nstatus: draft\n---\nPrivate',
    );
    assert.equal(await syncArticles(source, target), 0);
    await assert.rejects(
      access(join(target, 'src/content/articles/an-article.md')),
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
