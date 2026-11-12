interface Raindrop {
  title?: string;
  link?: string;
  domain?: string;
  excerpt?: string;
  tags?: string[];
}

export interface HomepageBookmark {
  title: string;
  link: string;
  domain: string;
  excerpt: string;
  tags: string[];
}

export async function getHomepageBookmarks(): Promise<HomepageBookmark[]> {
  const token = process.env.RAINDROP_ACCESS_TOKEN;
  if (!token) return [];

  const url = new URL('https://api.raindrop.io/rest/v1/raindrops/0');
  url.searchParams.set('search', '#homepage');
  url.searchParams.set('sort', '-created');
  url.searchParams.set('perpage', '3');

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(
      `Raindrop API request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    result?: boolean;
    items?: Raindrop[];
  };
  if (!data.result || !Array.isArray(data.items)) {
    throw new Error('Raindrop API returned an unexpected response');
  }

  return data.items.flatMap((item) => {
    if (!item.title || !item.link) return [];

    let link: URL;
    try {
      link = new URL(item.link);
    } catch {
      return [];
    }
    if (link.protocol !== 'https:' && link.protocol !== 'http:') return [];

    return [
      {
        title: item.title,
        link: link.href,
        domain: item.domain || link.hostname,
        excerpt: item.excerpt || '',
        tags: Array.isArray(item.tags)
          ? item.tags.filter((tag) => tag !== 'homepage')
          : [],
      },
    ];
  });
}
