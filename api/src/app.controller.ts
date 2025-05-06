import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { ApiOperation, ApiResponse } from "@nestjs/swagger"

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get("ping")
  @ApiOperation({ summary: "Ping the server" })
  @ApiResponse({ status: 200, description: "Pong" })
  ping() {
    return "Pong"
  }
}
