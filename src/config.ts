// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import { Config } from '@edge/config'
import { version } from '../package.json'

export class GlobalConfig {
  static readonly logLevel = Config.getEnvString('LOG_LEVEL', 'info')
  static readonly networkBotEnabled = Config.getEnvBoolean('NETWORK_BOT_ENABLED', true)
  static readonly networkBotToken = Config.getEnvString('NETWORK_BOT_TOKEN', '')
  static readonly networkUpdateInterval = Config.getEnvNumber('NETWORK_UPDATE_INTERVAL', 1000 * 15)
  static readonly priceBotEnabled = Config.getEnvBoolean('PRICE_BOT_ENABLED', true)
  static readonly priceBotToken = Config.getEnvString('PRICE_BOT_TOKEN', '')
  static readonly priceUpdateInterval = Config.getEnvNumber('PRICE_UPDATE_INTERVAL', 1000 * 5)
  static readonly version = version
}
