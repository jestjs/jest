const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json());

// Static files
app.use(express.static(path.join(__dirname, '/../client/')));
app.use(express.static(path.join(__dirname, '/../node_modules')));

// const for the API route to use
const teamAmericaAPIRoutes = require('./routes/teamAmericaAPIRoutes.js');

// routing for the API
app.use('/', teamAmericaAPIRoutes);

const port = process.env.PORT || 5000;

app.listen(port, (err) => {
  if (err) {
    console.log('Error occurred : ', err);
  }
  console.log('Server is listening to port : ', port);
});

const staticSrv = express();
staticSrv.use('/', express.static(__dirname + '/static/'));
staticSrv.listen(8001);
