import { HttpResponse } from '../interfaces/http';
import { Request, Response } from 'express';
 
class HealthController {
  async handle(req: Request,res: Response): Promise<void> {
    try {
      const httpResponse = {
        body: {
          datetime: new Date(),
        },
        status: 200,
      };
      res.status(httpResponse.status).json(httpResponse.body);
    } catch (err) {
      console.error({
        err,
      });
      res.status(500).json(err);
    }
  }
}

export default HealthController;
