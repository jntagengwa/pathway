import {
  Av30ComputeService,
  Av30ComputationResult,
} from "./av30-compute.service";

export class Av30ComputeJob {
  constructor(private readonly service = new Av30ComputeService()) {}

  async run(
    tenantIds: string[],
    now: Date = new Date(),
  ): Promise<Av30ComputationResult[]> {
    if (!tenantIds.length) {
      throw new Error("AV30 compute job requires at least one tenantId");
    }

    const contexts = await this.service.resolveTenantContexts(tenantIds);
    return this.service.computeForTenants(contexts, now);
  }
}

