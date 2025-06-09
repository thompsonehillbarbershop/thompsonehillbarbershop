import { Controller, Get, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { AppService } from './app.service'
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { Response, Request } from "express"
import { JwtAuthGuard } from "./auth/guards/jwt-auth/jwt-auth.guard"
import { ConfigService } from "@nestjs/config"

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) { }

  @Get("ping")
  @ApiOperation({ summary: "Ping the server" })
  @ApiResponse({ status: 200, description: "Pong" })
  ping() {
    return "Pong"
  }

  @Get("cleanup")
  @ApiOperation({ summary: "Cleanup server" })
  @ApiResponse({ status: 200 })
  @ApiHeader({
    name: "cron_secret",
    description: "Secret key to authorize the cron job",
    required: true
  })
  cleanup(
    @Req() req: Request
  ) {
    // @ts-ignore non typed
    const cronSecret = req.headers?.cron_secret
    if (cronSecret !== this.configService.get("CRON_JOB_AUTH_SECRET")) {
      throw new UnauthorizedException("Unauthorized")
    }

    return this.appService.cleanup()
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('export-csv')
  @ApiOperation({ summary: 'Export all collections to CSV files' })
  @ApiResponse({
    status: 200,
    description: 'Returns a zip file containing all collections exported to CSV',
    content: {
      'application/zip': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportAllToCSV(@Res() res: Response) {
    return this.appService.exportCSV(res)
  }
}
