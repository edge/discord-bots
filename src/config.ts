// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import { Config } from '@edge/config'
import { version } from '../package.json'

export class GlobalConfig {
  static readonly discordAccessToken = Config.getEnvString('DISCORD_ACCESS_TOKEN', '')
  static readonly version = version
}
