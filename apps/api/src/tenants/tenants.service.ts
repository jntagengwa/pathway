import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import { createTenantDto, type CreateTenantDto } from "./dto/create-tenant.dto";

// Narrow unknown errors that may come from Prisma without using `any`
function isPrismaError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string"
  );
}

@Injectable()
export class TenantsService {
  async list() {
    return prisma.tenant.findMany({
      select: { id: true, name: true, slug: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBySlug(slug: string) {
    const t = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, createdAt: true },
    });
    if (!t) throw new NotFoundException("tenant not found");
    return t;
  }

  async create(input: CreateTenantDto) {
    // Normalize first (be forgiving to clients), then validate
    const normalized = { ...input, slug: String(input.slug).toLowerCase() };
    const parsed = createTenantDto.parse(normalized);

    // Pre-check for unique slug to provide a clean error (still race-safe with unique index)
    const exists = await prisma.tenant.findUnique({
      where: { slug: parsed.slug },
    });
    if (exists) {
      throw new BadRequestException("slug already exists");
    }

    try {
      return await prisma.tenant.create({
        data: parsed,
        select: { id: true, name: true, slug: true, createdAt: true },
      });
    } catch (e: unknown) {
      if (isPrismaError(e) && e.code === "P2002") {
        throw new BadRequestException("slug already exists");
      }
      throw e;
    }
  }
}
