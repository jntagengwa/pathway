import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { LeadsService } from "./leads.service";
import {
  createDemoLeadDto,
  createToolkitLeadDto,
  createTrialLeadDto,
  type CreateDemoLeadDto,
  type CreateToolkitLeadDto,
  type CreateTrialLeadDto,
} from "./dto/create-lead.dto";

@Controller("leads")
export class LeadsController {
  constructor(@Inject(LeadsService) private readonly leadsService: LeadsService) {}

  @Post("demo")
  @HttpCode(HttpStatus.OK)
  async createDemoLead(@Body() dto: CreateDemoLeadDto) {
    const parsed = createDemoLeadDto.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }

    const lead = await this.leadsService.createDemoLead(parsed.data);
    return { success: true, id: lead.id };
  }

  @Post("toolkit")
  @HttpCode(HttpStatus.OK)
  async createToolkitLead(@Body() dto: CreateToolkitLeadDto) {
    const parsed = createToolkitLeadDto.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }

    const lead = await this.leadsService.createToolkitLead(parsed.data);
    return { success: true, id: lead.id };
  }

  @Post("trial")
  @HttpCode(HttpStatus.OK)
  async createTrialLead(@Body() dto: CreateTrialLeadDto) {
    const parsed = createTrialLeadDto.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }

    const lead = await this.leadsService.createTrialLead(parsed.data);
    return { success: true, id: lead.id };
  }
}

