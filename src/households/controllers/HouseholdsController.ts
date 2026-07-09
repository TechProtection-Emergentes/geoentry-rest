import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { HouseholdsService } from '../services/HouseholdsService';

@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get('user/:userId/members')
  async getMembers(@Param('userId') userId: string) {
    return this.householdsService.getMembersByUserId(userId);
  }

  @Post(':id/members')
  async inviteMember(
    @Param('id') householdId: string,
    @Body() body: { email: string; role: 'FAMILY' | 'GUEST' }
  ) {
    return this.householdsService.inviteMember(householdId, body.email, body.role || 'GUEST');
  }
}
