import express from 'express';
import cors from 'cors';
import { ExpressFactory } from './config/app.config';
import { AppModule } from './app.module';
import LoggerService from './helper/logger.service';

import { APP_CONST } from './constants/application.constant';
import { ErrorHandler } from './middleware/error.handler';
import { protectMiddleware } from './middleware/protect.middleware';

async function bootstrap() {
  const app = await ExpressFactory.create({
    app: express(),
    baseModule: AppModule,
    authMiddleware: protectMiddleware,
    plugins: [express.json(), cors({ origin: '*' })],
  });

  app.use(ErrorHandler);
  app.listen(APP_CONST.PORT, () => LoggerService.log(APP_CONST.BOOTSTRAP_MSG));
}

bootstrap();
