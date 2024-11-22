import LoggerService from '@/helper/logger.service';
import type { Express, Handler, Request } from 'express';

type Plugins = Array<Handler>;
type CreateParams = {
  baseModule: new (...props: any[]) => any;
  plugins: Plugins;
  authMiddleware?: (req: Request) => Promise<void>;
};

export class ExpressFactory {
  private static logger = LoggerService(ExpressFactory.name);

  static async create(app: Express, props: CreateParams): Promise<Express> {
    this.logger.log('Starting Express application...');

    //? ADDING MIDDLEWARES
    props.plugins.forEach((eachPlugin) => {
      this.logger.log(`Initializing {${eachPlugin.name}}`);
      app.use(eachPlugin);
    });

    //? ADDING MODULE CLASS
    const baseInstance = new props.baseModule();
    if (baseInstance.init) return await baseInstance.init(app, props.authMiddleware);

    console.error(`Invalid ${props.baseModule.name} Class, add @Module() decorator`);
    process.exit(-1);
  }
}
