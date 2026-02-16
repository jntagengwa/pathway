import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { BlogService } from "./blog.service";

jest.mock("@pathway/db", () => ({
  prisma: {
    blogPost: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    blogAsset: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("BlogService", () => {
  let service: BlogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogService],
    }).compile();
    service = module.get<BlogService>(BlogService);
    jest.clearAllMocks();
  });

  describe("createDraft", () => {
    it("creates a draft when slug is unique", async () => {
      (prisma.blogPost.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.blogPost.create as jest.Mock).mockResolvedValue({
        id: "p1",
        title: "Test",
        slug: "test",
        status: "DRAFT",
      });

      const result = await service.createDraft({
        title: "Test",
        slug: "test",
      });

      expect(prisma.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug: "test" },
      });
      expect(prisma.blogPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test",
          slug: "test",
          status: "DRAFT",
        }),
      });
      expect(result.status).toBe("DRAFT");
    });

    it("throws when slug is already in use", async () => {
      (prisma.blogPost.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });

      await expect(
        service.createDraft({ title: "Test", slug: "taken" }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.blogPost.create).not.toHaveBeenCalled();
    });
  });

  describe("listPublic", () => {
    it("returns only published posts with publishedAt <= now", async () => {
      const now = new Date();
      const posts = [
        {
          id: "p1",
          slug: "post-1",
          status: "PUBLISHED",
          publishedAt: new Date(now.getTime() - 1000),
        },
      ];
      (prisma.blogPost.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.blogPost.findMany as jest.Mock).mockResolvedValue(posts);

      const result = await service.listPublic(20);

      expect(prisma.blogPost.updateMany).toHaveBeenCalledWith({
        where: {
          status: "SCHEDULED",
          publishedAt: { lte: expect.any(Date) },
        },
        data: { status: "PUBLISHED" },
      });
      expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          publishedAt: { lte: expect.any(Date) },
        },
        take: 21,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      });
      expect(result.posts).toHaveLength(1);
    });
  });

  describe("publish", () => {
    it("sets status to PUBLISHED and publishedAt", async () => {
      const post = {
        id: "p1",
        slug: "test",
        status: "DRAFT",
        contentJson: { type: "doc", content: [] },
      };
      (prisma.blogPost.findUnique as jest.Mock).mockResolvedValue(post);
      (prisma.blogPost.update as jest.Mock).mockResolvedValue({
        ...post,
        status: "PUBLISHED",
        publishedAt: expect.any(Date),
      });

      const result = await service.publish("p1", "https://nexsteps.dev");

      expect(prisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: expect.objectContaining({
          status: "PUBLISHED",
          publishedAt: expect.any(Date),
          contentHtml: expect.any(String),
        }),
      });
      expect(result.slug).toBe("test");
    });

    it("throws when post not found", async () => {
      (prisma.blogPost.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.publish("missing", "https://nexsteps.dev")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws when already published", async () => {
      (prisma.blogPost.findUnique as jest.Mock).mockResolvedValue({
        id: "p1",
        status: "PUBLISHED",
      });

      await expect(service.publish("p1", "https://nexsteps.dev")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("delete", () => {
    it("deletes post and returns slug", async () => {
      (prisma.blogPost.findUnique as jest.Mock).mockResolvedValue({
        id: "p1",
        slug: "test-post",
      });
      (prisma.blogPost.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await service.delete("p1");

      expect(prisma.blogPost.findUnique).toHaveBeenCalledWith({ where: { id: "p1" } });
      expect(prisma.blogPost.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
      expect(result).toEqual({ slug: "test-post" });
    });

    it("throws when post not found", async () => {
      (prisma.blogPost.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.delete("missing")).rejects.toThrow(NotFoundException);
      expect(prisma.blogPost.delete).not.toHaveBeenCalled();
    });
  });
});
