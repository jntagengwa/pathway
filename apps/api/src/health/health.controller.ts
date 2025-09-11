import { Controller, Get } from "@nestjs/common";
import { prisma } from "@pathway/db";

@Controller("health")
export class HealthController {
  @Get()
  async ok() {
    const now = await prisma.$queryRawUnsafe<{ now: string }[]>(
      "SELECT NOW()::text as now",
    );
    return { status: "ok", dbTime: now[0]?.now ?? null };
  }
}
