// Copyright (C) 2022 Edge Network Technologies Limited
// Use of this source code is governed by a GNU GPL-style license
// that can be found in the LICENSE.md file. All rights reserved.

// import * as metrics from './metrics'
// import cors from 'cors'
import { NetworkBot } from '..'
import cors from 'cors'
import { version } from '../../../package.json'
import express, { ErrorRequestHandler, RequestHandler } from 'express'

/**
 * Index handler.
 * Displays product name and version.
 */
const index: RequestHandler = (req, res) => {
  res.json({
    name: 'network_bot',
    version
  })
}

export class API {
  private app: express.Express
  private network: NetworkBot

  constructor(network: NetworkBot) {
    this.app = express()
    this.network = network
  }

  async initialize (): Promise<void> {
    const app = this.app
    app.use(cors())
    app.use(express.json())

    app.get('/', index)
    app.get('/metrics', async (req, res) => {
      res.send(await this.network.metricsRegistry.registry.metrics())
    })

    app.listen('5000')
  }
}
