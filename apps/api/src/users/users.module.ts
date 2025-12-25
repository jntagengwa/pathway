import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
