// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

'use strict';

import {Server} from 'http';

const app = new Server();

app.listen({host: 'localhost', port: 0});
