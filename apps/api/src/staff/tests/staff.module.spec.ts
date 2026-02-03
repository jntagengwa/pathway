import { Test, TestingModule } from "@nestjs/testing";
import { StaffModule } from "../staff.module";

/**
 * Regression: StaffController uses AuthUserGuard, which depends on AuthIdentityService.
 * StaffModule must import AuthModule so those dependencies are available in StaffModule context.
 * Without AuthModule import, Nest throws: "Nest can't resolve dependencies of the AuthUserGuard (?).
 * Please make sure that the argument AuthIdentityService at index [0] is available in the StaffModule context."
 */
describe("StaffModule", () => {
  it("compiles when StaffModule is built (AuthUserGuard and AuthIdentityService resolved via AuthModule)", async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [StaffModule],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(StaffModule)).toBeDefined();
  });
});
