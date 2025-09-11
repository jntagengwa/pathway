import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";

// --- Feature modules (scaffolds only; endpoints/services added later) ---
@Module({})
class TenantsModule {}
@Module({})
class UsersModule {}
@Module({})
class GroupsModule {}
@Module({})
class ChildrenModule {}
@Module({})
class AttendanceModule {}
@Module({})
class LessonsModule {}

// Scheduling / Rota
@Module({})
class SessionsModule {}
@Module({})
class AssignmentsModule {}
@Module({})
class PreferencesModule {}
@Module({})
class SwapsModule {}

// Comms & Safeguarding
@Module({})
class AnnouncementsModule {}
@Module({})
class NotesModule {}
@Module({})
class ConcernsModule {}

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
    ConcernsModule,
  ],
})
export class AppModule {}
