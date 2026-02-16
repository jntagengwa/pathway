import { z } from "zod";

export const updateBlogPostDto = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  excerpt: z.string().optional().nullable(),
  contentJson: z.record(z.unknown()).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  thumbnailImageId: z.string().uuid().optional().nullable(),
  headerImageId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
});

export type UpdateBlogPostDto = z.infer<typeof updateBlogPostDto>;
