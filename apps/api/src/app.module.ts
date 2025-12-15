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

// // Comms & Safeguarding
import { AnnouncementsModule } from "./announcements/announcements.module";
import { NotesModule } from "./notes/notes.module";
import { ConcernsModule } from "./concerns/concerns.module";
import { DsarModule } from "./dsar/dsar.module";

@Module({
  imports: [
    CommonModule,
    HealthModule,
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
    AnnouncementsModule,
    NotesModule,
    ConcernsModule,
    DsarModule,
    OrgsModule,
    BillingModule,
  ],
})
export class AppModule {}
