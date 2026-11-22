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
import matter from 'gray-matter';
import sharp from 'sharp';
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
    await sharp({
      create: {
        width: 1600,
        height: 900,
        channels: 3,
        background: '#ffffff',
      },
    })
      .png()
      .toFile(join(article, 'header.png'));
    await writeFile(
      join(article, 'post.md'),
      '---\ntitle: A useful test\ndescription: A description\nstatus: published\npublished_at: 2026-10-27\ntags: [testing]\n---\n![Example](header.png)\n[External](https://example.com)',
    );
    assert.equal(await syncArticles(source, target, { base: '/website/' }), 1);
    const result = await readFile(
      join(target, 'src/content/articles/an-article.md'),
      'utf8',
    );
    const { data, content } = matter(result);
    assert.equal(data.title, 'A useful test');
    assert.equal(data.description, 'A description');
    assert.equal(data.category, 'testing');
    assert.equal(data.draft, false);
    assert.equal(data.image, '/article-covers/an-article.webp');
    assert.equal(
      data.source,
      'https://github.com/RoRoche/articles/blob/main/an-article/post.md',
    );
    assert.match(content, /Example/);
    assert.match(content, /External/);
    assert.match(result, /\/website\/article-assets\/an-article\/header.png/);
    assert.match(result, /https:\/\/example.com/);
    await access(join(target, 'public/article-assets/an-article/header.png'));
    const coverPath = join(target, 'public/article-covers/an-article.webp');
    const coverMetadata = await sharp(coverPath).metadata();
    assert.equal(coverMetadata.format, 'webp');
    assert.ok(coverMetadata.width <= 1200);
    assert.ok(coverMetadata.height <= 630);
    await writeFile(
      join(article, 'post.md'),
      '---\nstatus: draft\n---\nPrivate',
    );
    assert.equal(await syncArticles(source, target), 0);
    await assert.rejects(
      access(join(target, 'src/content/articles/an-article.md')),
    );
    await assert.rejects(access(coverPath));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
