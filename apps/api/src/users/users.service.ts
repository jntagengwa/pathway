import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import { createUserDto, type CreateUserDto } from "./dto/create-user.dto";
import { updateUserDto, type UpdateUserDto } from "./dto/update-user.dto";
import { ZodError } from "zod";

function isPrismaError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string"
  );
}

@Injectable()
export class UsersService {
  async list() {
    return prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async create(input: CreateUserDto) {
    // Normalize then validate
    const normalized = {
      ...input,
      email: String(input.email).toLowerCase().trim(),
    };
    try {
      // validate inside try so ZodError maps to 400
      const parsed = createUserDto.parse(normalized);

      // Optional pre-check for friendlier error message on duplicate email
      const existing = await prisma.user.findUnique({
        where: { email: parsed.email },
      });
      if (existing) throw new BadRequestException("email already in use");

      return await prisma.user.create({
        data: {
          email: parsed.email,
          name: parsed.name,
          tenant: { connect: { id: parsed.tenantId } },
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.errors);
      }
      if (isPrismaError(e) && e.code === "P2002") {
        throw new BadRequestException("email already in use");
      }
      throw e;
    }
  }

  async update(id: string, input: UpdateUserDto) {
    const normalized = {
      ...input,
      email: input.email ? String(input.email).toLowerCase().trim() : undefined,
    };
    const parsed = updateUserDto.parse(normalized);

    try {
      return await prisma.user.update({
        where: { id },
        data: parsed,
        select: { id: true, email: true, name: true, createdAt: true },
      });
    } catch (e: unknown) {
      if (isPrismaError(e) && e.code === "P2002") {
        throw new BadRequestException("email already in use");
      }
      // Prisma throws P2025 on update of missing record; map to 404
      if (isPrismaError(e) && e.code === "P2025") {
        throw new NotFoundException("User not found");
      }
      throw e;
    }
  }
}
