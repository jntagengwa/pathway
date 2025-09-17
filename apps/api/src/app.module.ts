import { Module } from "@nestjs/common";

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
// import { ConcernsModule } from "./concerns/concerns.module";

@Module({
  imports: [
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
    // ConcernsModule,
  ],
})
export class AppModule {}
