import { BetterAuthGuard } from '@/auth';
import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UpdateParentInput } from './dto/update-parent.input';
import { ParentsService } from './parents.service';

@ApiTags('parents-self')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('v1/parents/me')
export class ParentsSelfController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get()
  @ApiOperation({ summary: 'My children across all schools/organizations' })
  getMyChildren(@Req() req: Request) {
    const userId = (req.user as { userId: string }).userId;
    return this.parentsService.getMyChildren(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my own parent profile (per organization)' })
  updateMyProfile(@Req() req: Request, @Body() input: UpdateParentInput) {
    const userId = (req.user as { userId: string }).userId;
    return this.parentsService.updateMyProfile(userId, input.id, input);
  }
}
