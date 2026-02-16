import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import type { Response } from "express";
import { BlogService } from "./blog.service";

@Controller("media")
export class BlogMediaController {
  constructor(@Inject(BlogService) private readonly blogService: BlogService) {}

  @Get(":id")
  async streamAsset(
    @Param("id") id: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const asset = await this.blogService.getAssetById(id);
    if (!asset) {
      throw new NotFoundException("Asset not found");
    }
    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(asset.bytes);
  }
}
