'use strict';

const http = require('http');

const app = new http.Server();

app.listen({host: 'localhost', port: 0});
