// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import { API } from './api'
import Discord from 'discord.js'
import { GlobalConfig } from '../config'
import superagent from 'superagent'
import { Log, LogLevelFromString, StdioAdaptor } from'@edge/log'
import { Metrics, MetricsRegistry } from './metrics'

export class NetworkBot {
  private api: API
  public metricsRegistry: MetricsRegistry

  private log: Log
  private client: Discord.Client
  private interval?: NodeJS.Timeout
  private lastSessions?: number

  constructor() {
    this.log = new Log([new StdioAdaptor()], 'network-bot', LogLevelFromString(GlobalConfig.logLevel))

    this.api = new API(this)
    this.metricsRegistry = new MetricsRegistry(this, this.log)

    this.client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'GUILD_PRESENCES']})
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
  }

  onReady(): void {
    this.log.info(`Logged in as ${this.client.user?.tag}!`)

    this.updateActivity()
    if (this.interval) clearInterval(this.interval)
    this.interval = setInterval(this.updateActivity.bind(this), GlobalConfig.networkUpdateInterval)
  }

  async updateActivity(): Promise<void> {
    try {
      this.updateMembers()
      this.updateSessions()
    }
    catch (error) {
      this.log.error('Failed to update activity', error as Error)
    }
  }

  async updateSessions(): Promise<void> {
    const response = await superagent.get('https://stargate.edge.network/sessions/open')
    if (response.body) {
      const sessions = response.body.length
      if (this.lastSessions === sessions) return

      // Update network status via bot name/activity
      const activity = `${sessions} nodes online`
      this.log.info(`Updating status ticker to '${activity}'`)
      this.client.user?.setActivity('Network Status', { type: 'WATCHING' })
      this.client.guilds.cache.forEach(guild => guild.me?.setNickname(activity))
      this.lastSessions = sessions
      return
    }
    this.log.warn('Failed to query open sessions')
  }

  async updateMembers(): Promise<void> {
    // Update member counts via channels
    this.log.info('Updating member counts')
    const guild = this.client.guilds.resolve(GlobalConfig.guildId)
    const guildMembers = await guild?.members.fetch()
    const guildMembersOnline = guildMembers?.filter(m => !m.user.bot && m.presence !== null)
    const totalChannel = guild?.channels.resolve(GlobalConfig.membersTotalChannelId)
    const onlineChannel = guild?.channels.resolve(GlobalConfig.membersOnlineChannelId)
    const totalCount = guildMembers ? guildMembers.size : 0
    const onlineCount = guildMembersOnline ? guildMembersOnline.size : 0
    totalChannel?.setName(`Total Members: ${this.formatNumber(totalCount)}`)
    onlineChannel?.setName(`Online Members: ${this.formatNumber(onlineCount)}`)
    this.log.info('Member counts updated', { total: guildMembers?.size, online: guildMembersOnline?.size })
    // update metrics
    const metrics: Metrics = {
      members: {
        offline: totalCount - onlineCount,
        online: onlineCount
      }
    }
    this.metricsRegistry.updateMetrics(metrics)
  }

  formatNumber(number: number): string {
    if (number > 1000) return `${(number / 1000).toFixed(2)}K`
    return number.toString()
  }

  start(): void {
    if (!GlobalConfig.networkBotEnabled) return
    this.api.initialize()
    this.metricsRegistry.initialize()
    this.log.info('Logging in...')
    this.client.login(GlobalConfig.networkBotToken)
  }
}
