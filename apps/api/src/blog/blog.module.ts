import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { BlogService } from "./blog.service";
import { BlogAdminController } from "./blog-admin.controller";
import { BlogPublicController } from "./blog-public.controller";
import { BlogMediaController } from "./blog-media.controller";

@Module({
  imports: [CommonModule],
  controllers: [BlogAdminController, BlogPublicController, BlogMediaController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
