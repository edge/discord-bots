# Copyright (C) 2022 Edge Network Technologies Limited
# Use of this source code is governed by a GNU GPL-style license
# that can be found in the LICENSE.md file. All rights reserved.

FROM node:16

WORKDIR /bots

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy and transpile app src
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

CMD ["npm", "start"]
