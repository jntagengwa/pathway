import { BuyNowService } from "../buy-now.service";
import { PlanPreviewService } from "../plan-preview.service";
import { BuyNowProvider } from "../buy-now.provider";
import { BillingProvider } from "@pathway/db";
import { type BillingProviderConfig } from "../billing-provider.config";
import type { PathwayRequestContext } from "@pathway/auth";

const prismaMock = {
  pendingOrder: { create: jest.fn(), update: jest.fn() },
};

jest.mock("@pathway/db", () => {
  const actual = jest.requireActual("@pathway/db");
  return {
    ...actual,
    get prisma() {
      return prismaMock;
    },
  };
});

describe("BuyNowService", () => {
  const previewService = new PlanPreviewService();
  const providerMock: jest.Mocked<BuyNowProvider> = {
    createCheckoutSession:
      jest.fn() as jest.MockedFunction<BuyNowProvider["createCheckoutSession"]>,
  };
  const contextMock: Partial<PathwayRequestContext> = {
    currentOrgId: "org_1",
    currentTenantId: "tenant_1",
  };
  const providerConfig: BillingProviderConfig = {
    activeProvider: "FAKE",
    stripe: {},
    goCardless: {},
  };

  const baseRequest = {
    org: {
      orgName: "Test Org",
      contactName: "Alice Doe",
      contactEmail: "alice@example.com",
    },
    successUrl: "https://example.com/success",
    cancelUrl: "https://example.com/cancel",
  };

  beforeEach(() => {
    providerMock.createCheckoutSession.mockReset();
    providerMock.createCheckoutSession.mockResolvedValue({
      provider: "fake",
      sessionId: "fake_session",
      sessionUrl: "https://example.test/checkout/fake_session",
    });
    prismaMock.pendingOrder.create.mockResolvedValue({
      id: "po_1",
      tenantId: contextMock.currentTenantId,
      orgId: contextMock.currentOrgId,
    });
    prismaMock.pendingOrder.update.mockResolvedValue({});
  });

  it("computes preview caps for known plan and calls provider", async () => {
    const service = new BuyNowService(
      previewService,
      providerMock,
      contextMock as PathwayRequestContext,
      providerConfig,
    );

    const result = await service.checkout({
      ...baseRequest,
      plan: { planCode: "STARTER_MONTHLY", av30AddonBlocks: 2 },
    });

    expect(providerMock.createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(providerMock.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ pendingOrderId: "po_1" }),
      expect.objectContaining({ orgId: "org_1", tenantId: "tenant_1" }),
    );
    expect(prismaMock.pendingOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: contextMock.currentTenantId,
          orgId: contextMock.currentOrgId,
          planCode: "STARTER_MONTHLY",
          provider: BillingProvider.STRIPE,
        }),
      }),
    );
    expect(prismaMock.pendingOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "po_1" },
        data: { providerCheckoutId: "fake_session" },
      }),
    );
    expect(result.preview.av30Cap).toBe(100); // 50 base + 2*25
    expect(result.preview.maxSites).toBe(1);
    expect(result.warnings).toContain("price_not_included");
    expect(result.warnings).not.toContain("unknown_plan_code");
  });

  it("handles unknown plan by using add-ons only and warns", async () => {
    const service = new BuyNowService(
      previewService,
      providerMock,
      contextMock as PathwayRequestContext,
      providerConfig,
    );

    const result = await service.checkout({
      ...baseRequest,
      plan: { planCode: "LEGACY_UNKNOWN", av30AddonBlocks: 2 },
    });

    expect(providerMock.createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(result.preview.planTier).toBeNull();
    expect(result.preview.av30Cap).toBe(50); // 2*25 from add-ons only
    expect(result.warnings).toEqual(
      expect.arrayContaining(["price_not_included", "unknown_plan_code"]),
    );
  });

  it("normalises negative add-ons to zero", async () => {
    const service = new BuyNowService(
      previewService,
      providerMock,
      contextMock as PathwayRequestContext,
      providerConfig,
    );

    const result = await service.checkout({
      ...baseRequest,
      plan: { planCode: "STARTER_MONTHLY", av30AddonBlocks: -5 },
    });

    expect(result.preview.av30Cap).toBe(50); // base only, add-ons clamped
    expect(providerMock.createCheckoutSession).toHaveBeenCalledTimes(1);
  });
});

