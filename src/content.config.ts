import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { POST_DIRS } from './lib/post-sources.mjs';

const posts = defineCollection({
  // Post IDs aren't used for routing (the `slug` field is), so rooting the
  // glob at the repo and listing each directory is safe.
  loader: glob({ pattern: POST_DIRS.map((dir) => `${dir}/**/*.md`), base: '.' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),             // raw YAML strings sort/format wrong otherwise
    tags: z.array(z.string()),         // freeform strings, NOT z.enum - taxonomy isn't locked yet
    excerpt: z.string(),
    slug: z.string(),                  // explicit URL source of truth, survives filename renames
    draft: z.boolean().default(false),
    // Marks a chapter's intro page. A chapter with no post marked `section:
    // true` renders flat (unchanged) in the left sidebar and gets no mini
    // chapter ToC - this default is what keeps existing chapters working.
    section: z.boolean().default(false),
  }),
});

export const collections = { posts };
