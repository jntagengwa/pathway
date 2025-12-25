import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";
import { PreferencesController } from "./preferences.controller";
import { PreferencesService } from "./preferences.service";

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}
