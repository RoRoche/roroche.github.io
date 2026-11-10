import { getArticles, href } from '../lib/content';
import { site as siteInfo } from '../data/site';

const escapeXml = (value: string) =>
  value.replace(
    /[<>&'"]/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character]!,
  );

export async function GET({ site }: { site: URL | undefined }) {
  if (!site) {
    throw new Error('Astro site URL is required to generate the RSS feed.');
  }

  const articles = (await getArticles()).filter(
    (article) => !article.data.draft,
  );
  const articleUrl = (id: string) =>
    new URL(href(`articles/${id}/`), site).toString();
  const items = articles
    .map(
      (article) => `<item>
      <title>${escapeXml(article.data.title)}</title>
      <link>${escapeXml(articleUrl(article.id))}</link>
      <guid isPermaLink="true">${escapeXml(articleUrl(article.id))}</guid>
      <description>${escapeXml(article.data.description)}</description>
      <pubDate>${article.data.date.toUTCString()}</pubDate>
      ${article.data.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`,
    )
    .join('\n    ');
  const feedUrl = new URL(href('rss.xml'), site).toString();
  const articlesUrl = new URL(href('articles/'), site).toString();

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${siteInfo.name} — Articles`)}</title>
    <link>${escapeXml(articlesUrl)}</link>
    <description>${escapeXml(siteInfo.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`,
    {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    },
  );
}
