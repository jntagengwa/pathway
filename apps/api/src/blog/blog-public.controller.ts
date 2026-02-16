import { Controller, Get, Param, Query, Inject } from "@nestjs/common";
import { BlogService } from "./blog.service";

@Controller("public/blog")
export class BlogPublicController {
  constructor(@Inject(BlogService) private readonly blogService: BlogService) {}

  @Get("posts")
  async listPosts(
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    const l = limit ? Math.min(50, Math.max(1, parseInt(limit, 10))) : 20;
    return this.blogService.listPublic(l, cursor);
  }

  @Get("posts/:slug")
  async getPost(@Param("slug") slug: string) {
    return this.blogService.getPublicBySlug(slug);
  }

  @Get("posts/:slug/related")
  async getRelated(@Param("slug") slug: string, @Query("limit") limit?: string) {
    const l = limit ? Math.min(10, Math.max(1, parseInt(limit, 10))) : 4;
    return this.blogService.getRelatedByTags(slug, l);
  }
}
