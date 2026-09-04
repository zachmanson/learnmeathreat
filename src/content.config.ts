import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),             // raw YAML strings sort/format wrong otherwise
    tags: z.array(z.string()),         // freeform strings, NOT z.enum - taxonomy isn't locked yet
    excerpt: z.string(),
    slug: z.string(),                  // explicit URL source of truth, survives filename renames
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
