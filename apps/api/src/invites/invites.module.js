var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { InvitesController } from "./invites.controller";
import { InvitesService } from "./invites.service";
import { AuthModule } from "../auth/auth.module";
import { MailerModule } from "../mailer/mailer.module";
let InvitesModule = class InvitesModule {
};
InvitesModule = __decorate([
    Module({
        imports: [AuthModule, MailerModule],
        controllers: [InvitesController],
        providers: [InvitesService],
        exports: [InvitesService],
    })
], InvitesModule);
export { InvitesModule };
