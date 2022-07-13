// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

import * as client from 'prom-client'
import { GlobalConfig } from '../../config'
import { Log } from '@edge/log'

/** Metrics object shared through context. */
export type PromMetrics = {
  members: client.Gauge<string>
}

const prefix = 'discord_'

/** Create a metrics registry. */
// export const createMetrics = (): [client.Registry, Metrics] => {
//   const r = new client.Registry()

//   if (config.metrics.collectDefault) client.collectDefaultMetrics({ register: r, prefix })

//   const m: Metrics = {
//     members: {
//       online: new client.Gauge({
//         name: `${prefix}online_members`,
//         help: 'Number of Discord server members currently online',
//         labelNames: ['status']
//       }),
//       total: new client.Gauge({
//         name: `${prefix}total_members`,
//         help: 'Total number of Discord server members',
//         labelNames: ['status']
//       })
//     }
//   }

//   r.registerMetric(m.members.online)
//   r.registerMetric(m.members.total)

//   return [r, m]
// }


// export const getMetrics = ({ metricsRegistry }: Context): AuthenticatedRequestHandler => async (req, res, next) => {
//   // if (!req.system) return unauthorized(res, next)
//   res.send(await metricsRegistry.metrics())
//   next()
// }


export class Metrics {
  // public gateway: Gateway
  // private log: Log
  private metrics: PromMetrics
  private network: any
  private registry: client.Registry

  constructor(network: any) {
    // this.log = log
    this.network = network

    // Initialise default metric collection
    client.collectDefaultMetrics({ prefix: 'discord' })

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
    // if (GlobalConfig.collectDefaultMetrics) client.collectDefaultMetrics({ register: this.registry, prefix })

    this.registry.registerMetric(this.metrics.members)

    await this.updateMembers()
    setInterval(this.updateMembers.bind(this), GlobalConfig.networkUpdateInterval)
    // this.log.info('Initialized metrics')
    console.log('Initialized metrics')
  }

  public async updateMembers(): Promise<void> {
    const metrics = this.network.metrics
    for (const status in metrics) {
      this.metrics.members.labels(status).set(metrics[status])
      // this.log.info(`Updated ${status} members metric`)
      console.log(`Updated ${status} members metric`)
    }
  }
}
