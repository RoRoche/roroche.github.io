import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    category: z.enum(['architecture', 'testing', 'devops', 'leadership']),
    image: z.string(),
    draft: z.boolean().default(false),
    source: z.url(),
  }),
});
export const collections = { articles };
