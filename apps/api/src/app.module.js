var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { OrgsModule } from "./orgs/orgs.module";
import { BillingModule } from "./billing/billing.module";
import { Module } from "@nestjs/common";
import { CommonModule } from "./common/common.module";
// Core modules
import { HealthModule } from "./health/health.module";
import { TenantsModule } from "./tenants/tenants.module"; // TODO: rename file
import { UsersModule } from "./users/users.module";
import { GroupsModule } from "./groups/groups.module";
import { ChildrenModule } from "./children/children.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { LessonsModule } from "./lessons/lessons.module";
// // Scheduling / Rota
import { SessionsModule } from "./sessions/sessions.module";
import { AssignmentsModule } from "./assignments/assignments.module";
import { PreferencesModule } from "./preferences/preferences.module";
import { SwapsModule } from "./swaps/swaps.module";
import { ParentsModule } from "./parents/parents.module";
// // Comms & Safeguarding
import { AnnouncementsModule } from "./announcements/announcements.module";
import { NotesModule } from "./notes/notes.module";
import { ConcernsModule } from "./concerns/concerns.module";
import { DsarModule } from "./dsar/dsar.module";
import { AuthModule } from "./auth/auth.module";
import { InvitesModule } from "./invites/invites.module";
import { MailerModule } from "./mailer/mailer.module";
import { LeadsModule } from "./leads/leads.module";
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            CommonModule,
            HealthModule,
            AuthModule,
            MailerModule,
            InvitesModule,
            TenantsModule,
            UsersModule,
            GroupsModule,
            ChildrenModule,
            AttendanceModule,
            LessonsModule,
            SessionsModule,
            AssignmentsModule,
            PreferencesModule,
            SwapsModule,
            ParentsModule,
            AnnouncementsModule,
            NotesModule,
            ConcernsModule,
            DsarModule,
            OrgsModule,
            BillingModule,
            LeadsModule,
        ],
    })
], AppModule);
export { AppModule };
