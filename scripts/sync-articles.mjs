import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
  access,
} from 'node:fs/promises';
import { resolve, join, relative, sep, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';

export function normalize(data, slug, { includeDrafts = false } = {}) {
  const draft =
    data.draft === true ||
    data.status === 'draft' ||
    (data.status !== 'published' && data.draft !== false);
  if (draft && !includeDrafts) return null;
  if (!data.title || !data.description)
    throw new Error(`${slug}: title and description are required`);
  const date = data.published_at || data.date;
  if ((!draft && !date) || (date && Number.isNaN(Date.parse(date))))
    throw new Error(
      `${slug}: published articles need a valid published_at or date`,
    );
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error(`Invalid permanent slug: ${slug}`);
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const explicit = data.category?.toLowerCase();
  const categories = ['architecture', 'testing', 'devops', 'leadership'];
  if (explicit && !categories.includes(explicit))
    throw new Error(`${slug}: unsupported category ${explicit}`);
  const category =
    explicit ||
    (tags.some((t) => /leadership|management|mentoring/i.test(t))
      ? 'leadership'
      : tags.some((t) => /test|quality|hamcrest/i.test(t))
        ? 'testing'
        : tags.some((t) => /devops|ci-cd|automation|delivery/i.test(t))
          ? 'devops'
          : 'architecture');
  return {
    title: data.title,
    description: data.description,
    date: date ? new Date(date).toISOString() : '1970-01-01T00:00:00.000Z',
    tags,
    category,
    draft,
  };
}

export async function syncArticles(
  source,
  destination = process.cwd(),
  options = {},
) {
  const output = join(destination, 'src/content/articles');
  const assets = join(destination, 'public/article-assets');
  const base = (options.base || '/').replace(/\/$/, '');
  const posts = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (
        entry.name.startsWith('.') ||
        ['node_modules', 'vendor'].includes(entry.name)
      )
        continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name === 'post.md') posts.push(path);
    }
  }
  await walk(source);
  const prepared = [];
  const slugs = new Set();
  for (const path of posts.sort()) {
    const { data, content } = matter(await readFile(path, 'utf8'));
    const directory = resolve(path, '..');
    const slug = data.slug || relative(source, directory).split(sep).at(-1);
    const normalized = normalize(data, slug, options);
    if (!normalized) continue;
    if (slugs.has(slug)) throw new Error(`Duplicate article slug: ${slug}`);
    slugs.add(slug);
    const image = data.image || 'header.png';
    if (/^(https?:)?\/\//.test(image)) normalized.image = image;
    else {
      const imagePath = resolve(directory, image);
      if (!imagePath.startsWith(directory + sep))
        throw new Error(`${slug}: image must stay in article directory`);
      await access(imagePath);
      normalized.image = `/article-assets/${slug}/${image.replace(/^\.\//, '')}`;
    }
    normalized.source = `https://github.com/RoRoche/articles/blob/main/${relative(source, path).split(sep).join('/')}`;
    // Keep article-local images and attachments available under the same permanent slug.
    const rewritten = content.replace(
      /(!?\[[^\]]*\]\()([^\s)]+)([^)]*\))/g,
      (match, before, target, after) => {
        if (/^(?:[a-z]+:|\/|#)/i.test(target)) return match;
        const local = posix.normalize(target.replace(/^\.\//, ''));
        if (local.startsWith('../'))
          throw new Error(`${slug}: assets must stay in article directory`);
        return `${before}${base}/article-assets/${slug}/${local}${after}`;
      },
    );
    prepared.push({
      slug,
      directory,
      markdown: matter.stringify(rewritten, normalized),
    });
  }
  // Validate all posts before replacing generated content.
  await rm(output, { recursive: true, force: true });
  await rm(assets, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await mkdir(assets, { recursive: true });
  await writeFile(join(output, '.gitkeep'), '');
  for (const post of prepared) {
    await writeFile(join(output, `${post.slug}.md`), post.markdown);
    await cp(post.directory, join(assets, post.slug), {
      recursive: true,
      filter: (path) =>
        !path.endsWith('post.md') &&
        !relative(post.directory, path)
          .split(sep)
          .some((p) => p.startsWith('.') && p !== ''),
    });
  }
  console.log(
    `Imported ${prepared.length} article(s); skipped ${posts.length - prepared.length} unpublished article(s).`,
  );
  return prepared.length;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const source = resolve(process.argv[2] || '.external/articles');
  if (!process.argv[2]) {
    await mkdir(resolve('.external'), { recursive: true });
    await rm(source, { recursive: true, force: true });
    execFileSync(
      'git',
      ['clone', '--depth=1', 'https://github.com/RoRoche/articles.git', source],
      { stdio: 'inherit' },
    );
  }
  await syncArticles(source, process.cwd(), {
    includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
    base: process.env.BASE_PATH || '/',
  });
}
