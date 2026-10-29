import { getCollection } from 'astro:content';
export const getArticles = async () =>
  (await getCollection('articles')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
export const href = (path = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const asset = (path: string) =>
  path.startsWith('/') ? href(path) : path;
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
export const articleDate = (date: Date, draft: boolean) =>
  draft && date.getTime() === 0 ? 'Unpublished draft' : formatDate(date);
