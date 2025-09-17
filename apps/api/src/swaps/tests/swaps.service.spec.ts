import { SwapStatus } from "@pathway/db";
import type { SwapsService } from "../../swaps/swaps.service";

describe("SwapsService", () => {
  type Swap = {
    id: string;
    assignmentId: string;
    fromUserId: string;
    toUserId: string | null;
    status: SwapStatus;
    createdAt: Date;
    updatedAt: Date;
  };

  type PrismaSwapDelegate = {
    create: jest.Mock<
      Promise<Swap>,
      [
        {
          data: {
            assignmentId: string;
            fromUserId: string;
            toUserId: string | null;
            status: SwapStatus;
          };
        },
      ]
    >;
    findUnique: jest.Mock<
      Promise<Swap | null>,
      [
        {
          where: { id: string };
        },
      ]
    >;
    findMany: jest.Mock<
      Promise<Swap[]>,
      [
        {
          where?: { fromUserId?: string; status?: SwapStatus };
          orderBy?: { createdAt: "asc" | "desc" };
        },
      ]
    >;
    update: jest.Mock<
      Promise<Swap>,
      [
        {
          where: { id: string };
          data: Partial<Pick<Swap, "toUserId" | "status">>;
        },
      ]
    >;
    delete: jest.Mock<
      Promise<Swap>,
      [
        {
          where: { id: string };
        },
      ]
    >;
  };

  type PrismaAssignmentDelegate = {
    findUnique: jest.Mock<
      Promise<{ id: string } | null>,
      [
        {
          where: { id: string };
          select: { id: true };
        },
      ]
    >;
  };

  type PrismaUserDelegate = {
    findUnique: jest.Mock<
      Promise<{ id: string } | null>,
      [
        {
          where: { id: string };
          select: { id: true };
        },
      ]
    >;
  };

  type PrismaMock = {
    swapRequest: PrismaSwapDelegate;
    assignment: PrismaAssignmentDelegate;
    user: PrismaUserDelegate;
  };

  const base: Swap = {
    id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    assignmentId: "11111111-1111-1111-1111-111111111111",
    fromUserId: "22222222-2222-2222-2222-222222222222",
    toUserId: null,
    status: SwapStatus.REQUESTED,
    createdAt: new Date("2025-01-01T12:00:00Z"),
    updatedAt: new Date("2025-01-01T12:00:00Z"),
  };

  // These will be set after we import the service under the mocked module graph
  let prisma: PrismaMock;
  let SwapsServiceClass: new () => SwapsService;
  let service: SwapsService;

  beforeEach(async () => {
    jest.resetModules();

    const prismaMock: PrismaMock = {
      swapRequest: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      assignment: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
    };

    // Mock @pathway/db to provide our prisma mock
    jest.doMock("@pathway/db", () => {
      const actual = jest.requireActual("@pathway/db");
      return { ...actual, prisma: prismaMock };
    });

    // Now import the service (it will receive the mocked prisma)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const svcMod = await import("../../swaps/swaps.service");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    SwapsServiceClass = svcMod.SwapsService;

    // Also import prisma from the mocked module so we can assert on calls
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const db = (await import("@pathway/db")) as unknown as {
      prisma: PrismaMock;
    };
    prisma = db.prisma;

    service = new SwapsServiceClass();
  });

  it("create should persist and return the swap", async () => {
    prisma.assignment.findUnique.mockResolvedValue({ id: base.assignmentId });
    prisma.user.findUnique.mockImplementation(
      async (args: { where: { id: string } }) => {
        const { id } = args.where;
        if (id === base.fromUserId) return { id };
        if (id === base.toUserId) return { id };
        return null;
      },
    );
    prisma.swapRequest.create.mockResolvedValue(base);

    const created = await service.create({
      assignmentId: base.assignmentId,
      fromUserId: base.fromUserId,
      toUserId: base.toUserId ?? undefined,
    });

    expect(prisma.swapRequest.create).toHaveBeenCalledWith({
      data: {
        assignmentId: base.assignmentId,
        fromUserId: base.fromUserId,
        toUserId: base.toUserId,
        status: SwapStatus.REQUESTED,
      },
    });
    expect(created).toEqual(base);
  });

  it("findOne should return a swap by id", async () => {
    prisma.swapRequest.findUnique.mockResolvedValue(base);

    const found = await service.findOne(base.id);
    expect(prisma.swapRequest.findUnique).toHaveBeenCalledWith({
      where: { id: base.id },
    });
    expect(found).toEqual(base);
  });

  it("findAll should forward filters and order by createdAt desc", async () => {
    const list = [base];
    prisma.swapRequest.findMany.mockResolvedValue(list);

    const result = await service.findAll({
      fromUserId: base.fromUserId,
      status: SwapStatus.REQUESTED,
    });

    expect(prisma.swapRequest.findMany).toHaveBeenCalledWith({
      where: { fromUserId: base.fromUserId, status: SwapStatus.REQUESTED },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual(list);
  });

  it("update should persist and return updated swap", async () => {
    const updated: Swap = {
      ...base,
      status: SwapStatus.ACCEPTED,
      toUserId: "33333333-3333-3333-3333-333333333333",
      updatedAt: new Date("2025-01-02T12:00:00Z"),
    };
    prisma.swapRequest.findUnique.mockResolvedValue(base);
    prisma.user.findUnique.mockResolvedValue({ id: updated.toUserId! });
    prisma.swapRequest.update.mockResolvedValue(updated);

    const result = await service.update(base.id, {
      status: SwapStatus.ACCEPTED,
      toUserId: updated.toUserId!,
    });

    expect(prisma.swapRequest.update).toHaveBeenCalledWith({
      where: { id: base.id },
      data: { status: SwapStatus.ACCEPTED, toUserId: updated.toUserId },
    });
    expect(result).toEqual(updated);
  });

  it("remove should delete and return the swap", async () => {
    prisma.swapRequest.delete.mockResolvedValue(base);

    const result = await service.remove(base.id);

    expect(prisma.swapRequest.delete).toHaveBeenCalledWith({
      where: { id: base.id },
    });
    expect(result).toEqual(base);
  });
});
