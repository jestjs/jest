'use strict';

import {Server} from 'http';

const app = new Server();

app.listen({host: 'localhost', port: 0});
