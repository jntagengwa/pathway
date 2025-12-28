var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { getPlanDefinition } from "./billing-plans";
let PlanPreviewService = class PlanPreviewService {
    // TODO: Keep in sync with Buy Now UI add-on block size (Option A: +25 AV30 blocks for Starter/Growth preview).
    av30BlockSize = 25;
    preview(input) {
        const trimmedPlanCode = (input.planCode ?? "").trim();
        const planDefinition = getPlanDefinition(trimmedPlanCode);
        const addons = input.addons ?? {};
        const base = this.computeBaseCaps(planDefinition);
        const addonResult = this.computeAddonCaps(addons);
        const effectiveCaps = this.combineCaps(base, addonResult.caps);
        const notes = this.buildNotes(planDefinition, addons, addonResult);
        const hasRawAddons = Object.values(addons).some((value) => value !== undefined);
        return {
            planCode: trimmedPlanCode,
            planTier: planDefinition?.tier ?? null,
            displayName: planDefinition?.displayName ?? null,
            billingPeriod: planDefinition?.billingPeriod ?? null,
            selfServe: planDefinition?.selfServe ?? null,
            base,
            addons: {
                ...addonResult.caps,
                ...(hasRawAddons ? { rawAddons: addons } : {}),
                extraAv30Blocks: addonResult.blocks,
            },
            effectiveCaps,
            notes,
        };
    }
    computeBaseCaps(plan) {
        return {
            av30Cap: plan?.av30Included ?? null,
            storageGbCap: plan?.storageGbIncluded ?? null,
            smsMessagesCap: plan?.smsMessagesIncluded ?? null,
            leaderSeatsIncluded: plan?.leaderSeatsIncluded ?? null,
            maxSites: plan?.maxSitesIncluded ?? null,
        };
    }
    computeAddonCaps(addons) {
        const normalise = (value) => {
            if (typeof value !== "number" || Number.isNaN(value))
                return { value: 0, negative: false };
            if (value < 0)
                return { value: 0, negative: true };
            return { value, negative: false };
        };
        const av30Blocks = normalise(addons.extraAv30Blocks);
        const storage = normalise(addons.extraStorageGb);
        const sms = normalise(addons.extraSmsMessages);
        const seats = normalise(addons.extraLeaderSeats);
        const sites = normalise(addons.extraSites);
        const blocks = av30Blocks.value > 0 ? av30Blocks.value : null;
        const caps = {
            av30Cap: av30Blocks.value > 0 ? av30Blocks.value * this.av30BlockSize : null,
            storageGbCap: storage.value > 0 ? storage.value : null,
            smsMessagesCap: sms.value > 0 ? sms.value : null,
            leaderSeatsIncluded: seats.value > 0 ? seats.value : null,
            maxSites: sites.value > 0 ? sites.value : null,
        };
        return {
            caps,
            blocks,
            hadNegative: av30Blocks.negative ||
                storage.negative ||
                sms.negative ||
                seats.negative ||
                sites.negative,
        };
    }
    combineCaps(base, addons) {
        const sum = (a, b) => {
            if (a === null && b === null)
                return null;
            return (a ?? 0) + (b ?? 0);
        };
        return {
            av30Cap: sum(base.av30Cap, addons.av30Cap),
            storageGbCap: sum(base.storageGbCap, addons.storageGbCap),
            smsMessagesCap: sum(base.smsMessagesCap, addons.smsMessagesCap),
            leaderSeatsIncluded: sum(base.leaderSeatsIncluded, addons.leaderSeatsIncluded),
            maxSites: sum(base.maxSites, addons.maxSites),
        };
    }
    buildNotes(plan, addons, addonResult) {
        const warnings = ["price_not_included"];
        let source = "plan_catalogue";
        if (!plan) {
            source = "unknown_plan";
            warnings.push("plan_not_in_catalogue", "using_addons_only");
        }
        if (plan?.maxSitesIncluded === null && (addonResult.caps.maxSites ?? 0) > 0) {
            warnings.push("extra_sites_ignored_for_unlimited_plan");
        }
        if (plan?.av30Included === null && (addonResult.caps.av30Cap ?? 0) > 0) {
            warnings.push("extra_av30_ignored_for_unlimited_plan");
        }
        if (addonResult.hadNegative) {
            warnings.push("negative_addon_values_normalised_to_zero");
        }
        return { source, warnings };
    }
};
PlanPreviewService = __decorate([
    Injectable()
], PlanPreviewService);
export { PlanPreviewService };
