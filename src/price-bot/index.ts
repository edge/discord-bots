// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import Discord from 'discord.js'
import { GlobalConfig } from '../config'
import superagent from 'superagent'
import { Log, LogLevelFromString, StdioAdaptor } from'@edge/log'

export class PriceBot {
  private log: Log
  private client: Discord.Client
  private interval?: NodeJS.Timeout
  private lastPrice?: number

  constructor() {
    this.log = new Log([new StdioAdaptor()], 'price-bot', LogLevelFromString(GlobalConfig.logLevel))

    this.client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] })
    this.client.on('error', this.onError.bind(this))
    this.client.on('warn', this.onWarn.bind(this))
    this.client.on('invalidated', this.onInvalidated.bind(this))
    this.client.on('rateLimit', this.onRateLimit.bind(this))
    this.client.on('messageCreate', this.onMessageCreate.bind(this))
    this.client.on('ready', this.onReady.bind(this))

  }

  onWarn(warn: string): void {
    this.log.warn(`Discord warn: ${warn}`)
  }

  onError(error: Error): void {
    this.log.error('Discord error:', error)
  }

  onInvalidated(): void {
    this.log.error('Session invalidated')
    if (this.interval) clearInterval(this.interval)
  }

  onRateLimit(rateLimitData: Discord.RateLimitData): void {
    this.log.warn(`Rate limit exceeded: ${rateLimitData.path}`, { rateLimitData })
  }

  onMessageCreate(message: Discord.Message): void {
    if (message.author.bot) return
    if (message.content === '!price') message.reply(`Latest price: $${this.lastPrice} USD/XE`)
  }

  onReady(): void {
    this.log.info(`Logged in as ${this.client.user?.tag}!`)

    if (this.interval) clearInterval(this.interval)
    this.interval = setInterval(this.updateActivity.bind(this), GlobalConfig.priceUpdateInterval)
  }

  async updateActivity(): Promise<void> {
    try {
      const response = await superagent.get('https://index.xe.network/token/current')

      if (response?.body?.usdPerXE) {
        const currentPrice = this.roundToSixDecimals(response.body.usdPerXE)
        if (this.lastPrice === currentPrice) return

        const difference = this.lastPrice ? this.roundToSixDecimals(currentPrice - this.lastPrice) : 0
        const sign = difference > 0 ? '+' : ''
        this.log.info(`Updating price ticker to ${currentPrice} USD/XE (${sign}${difference})`)

        const activity = `$${currentPrice.toFixed(6)}`
        this.client.user?.setActivity(activity, { type: 'WATCHING' })
        this.lastPrice = currentPrice

        return
      }

      this.log.warn('Failed to parse token value')
    }
    catch (error) {
      this.log.error('Failed to update activity', error as Error)
    }
  }

  roundToSixDecimals(value: number): number {
    return Math.round(value * 1000000) / 1000000
  }

  start(): void {
    if (!GlobalConfig.priceBotEnabled) return
    this.log.info('Logging in...')
    this.client.login(GlobalConfig.priceBotToken)
  }
}
