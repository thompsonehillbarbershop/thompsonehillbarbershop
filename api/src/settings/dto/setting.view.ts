import { ApiProperty } from "@nestjs/swagger"
import { ISetting } from "../entities/setting.entity"

export class SettingView {
  constructor(setting: ISetting) {
    Object.assign(this, setting)
  }

  @ApiProperty()
  creditCardFee?: number

  @ApiProperty()
  debitCardFee?: number

}