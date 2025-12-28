var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
let SessionsModule = class SessionsModule {
};
SessionsModule = __decorate([
    Module({
        imports: [CommonModule, BillingModule, AuthModule],
        controllers: [SessionsController],
        providers: [SessionsService],
        exports: [SessionsService],
    })
], SessionsModule);
export { SessionsModule };
