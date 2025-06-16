import { Inject, Injectable } from '@nestjs/common'
import { Model } from "mongoose"
import { IMongoSetting, toSettings } from "../mongo/schemas/settings.schema"
import { ISetting } from "./entities/setting.entity"
import { UpdateSettingDto } from "./dto/update-setting.input"

@Injectable()
export class SettingsService {
  @Inject("SettingSchema") private readonly settingSchema: Model<IMongoSetting>

  async getSettings(): Promise<ISetting> {
    const settings = await this.settingSchema.findOne().exec()

    if (settings) {
      return toSettings(settings)
    }

    return {
      id: "default",
      creditCardFee: 0,
      debitCardFee: 0,
    }
  }

  async updateSettings(dto: UpdateSettingDto): Promise<ISetting> {
    const existingSettings = await this.settingSchema.findOne().exec()

    if (existingSettings) {
      existingSettings.creditCardFee = dto.creditCardFee
      existingSettings.debitCardFee = dto.debitCardFee
      await existingSettings.save()
      return toSettings(existingSettings)
    } else {
      const newSettings = new this.settingSchema({
        _id: "default",
        creditCardFee: dto.creditCardFee,
        debitCardFee: dto.debitCardFee,
      })
      await newSettings.save()
      return toSettings(newSettings)
    }
  }
}
