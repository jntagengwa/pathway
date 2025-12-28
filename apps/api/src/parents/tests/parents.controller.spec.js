import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PathwayAuthGuard, PathwayRequestContext, UserTenantRole, } from "@pathway/auth";
import { ParentsController } from "../parents.controller";
import { ParentsService } from "../parents.service";
const tenantId = "tenant-1";
const orgId = "org-1";
const listMock = jest.fn();
const getMock = jest.fn();
const mockService = {
    findAllForTenant: listMock,
    findOneForTenant: getMock,
};
const buildRequestContext = (roles) => ({
    roles: {
        tenant: roles?.tenant ?? [],
        org: roles?.org ?? [],
    },
});
describe("ParentsController", () => {
    let controller;
    let requestContext;
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            controllers: [ParentsController],
            providers: [
                { provide: ParentsService, useValue: mockService },
                {
                    provide: PathwayRequestContext,
                    useValue: buildRequestContext({
                        tenant: [UserTenantRole.ADMIN],
                    }),
                },
            ],
        })
            .overrideGuard(PathwayAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        controller = module.get(ParentsController);
        requestContext = module.get(PathwayRequestContext);
    });
    it("lists parents for tenant/org", async () => {
        const rows = [
            {
                id: "p1",
                fullName: "Parent One",
                email: "parent1@test.local",
                childrenCount: 1,
            },
        ];
        listMock.mockResolvedValueOnce(rows);
        const result = await controller.list(tenantId, orgId);
        expect(result).toEqual(rows);
        expect(listMock).toHaveBeenCalledWith(tenantId, orgId);
    });
    it("returns detail when parent in tenant", async () => {
        const detail = {
            id: "p1",
            fullName: "Parent One",
            email: "parent1@test.local",
            children: [{ id: "c1", fullName: "Jess Doe" }],
        };
        getMock.mockResolvedValueOnce(detail);
        const result = await controller.getOne("p1", tenantId, orgId);
        expect(result).toEqual(detail);
        expect(getMock).toHaveBeenCalledWith(tenantId, orgId, "p1");
    });
    it("404s when parent missing", async () => {
        getMock.mockResolvedValueOnce(null);
        await expect(controller.getOne("missing", tenantId, orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it("forbids caller without staff roles", async () => {
        const ctx = requestContext;
        ctx.roles = { tenant: [UserTenantRole.PARENT], org: [] };
        await expect(controller.list(tenantId, orgId)).rejects.toBeInstanceOf(ForbiddenException);
        expect(listMock).not.toHaveBeenCalled();
    });
});
