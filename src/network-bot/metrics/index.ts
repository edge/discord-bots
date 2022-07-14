// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import * as client from 'prom-client'
import { GlobalConfig } from '../../config'
import { Log } from '@edge/log'
import { NetworkBot } from '..'

/** Metrics object shared through context. */
export type PromMetrics = {
  members: client.Gauge<string>
}

export type Members = {
  online: number
  offline: number
}

export type Metrics = {
  members: Members
}

const prefix = 'discord_'

export class MetricsRegistry {
  private log: Log
  private metrics: PromMetrics
  private network: NetworkBot
  public registry: client.Registry

  constructor(network: NetworkBot, log: Log) {
    this.log = log
    this.network = network

    // Initialise default metric collection
    client.collectDefaultMetrics({ prefix: 'discord_' })

    this.registry = new client.Registry()

    this.metrics = {
      members: new client.Gauge({
        name: `${prefix}members`,
        help: 'Number of Discord members by online status',
        labelNames: ['status']
      })
    }
  }

  public async initialize(): Promise<void> {
    if (GlobalConfig.collectDefaultMetrics) client.collectDefaultMetrics({ register: this.registry, prefix })

    this.registry.registerMetric(this.metrics.members)

    // this.log.info('Initialized metrics')
    console.log('Initialized metrics')
  }

  private async updateMembers(k: keyof Members, n: number): Promise<void> {
    this.metrics.members.labels(k).set(n)
  }

  public async updateMetrics(metrics: Metrics): Promise<void> {
    this.updateMembers('offline', metrics.members.offline)
    this.updateMembers('online', metrics.members.online)
    this.log.info('Updated members metric')
  }
}
