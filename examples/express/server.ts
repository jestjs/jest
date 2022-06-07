import Express from "express";
const router = require('./router.js');

const startExpressServer = () => {
  const app: Express.Application = Express();
  app.use('/', router);
  return app;
};

export default startExpressServer;
