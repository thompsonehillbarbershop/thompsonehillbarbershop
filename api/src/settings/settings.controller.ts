import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common'
import { SettingsService } from './settings.service'
import { UpdateSettingDto } from './dto/update-setting.input'
import { CombinedAuthGuard } from "../auth/guards/jwt-api-key/jwt-api-key.guard"
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiOperation } from "@nestjs/swagger"
import { SettingView } from "./dto/setting.view"
import { AdminGuard } from "../users/guards/is-admin.guard"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Get()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get settings' })
  @ApiOkResponse({ type: SettingView })
  async findOne() {
    const setting = await this.settingsService.getSettings()
    return new SettingView(setting)
  }

  @Put()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: SettingView })
  async update(@Body() updateSettingDto: UpdateSettingDto) {
    const updatedSetting = await this.settingsService.updateSettings(updateSettingDto)
    return new SettingView(updatedSetting)
  }
}
