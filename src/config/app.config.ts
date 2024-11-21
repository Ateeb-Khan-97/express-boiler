import LoggerService from '@/helper/logger.service';
import type { Express, Handler, Request } from 'express';

type Plugins = Array<Handler>;
type CreateParams = {
  app: Express;
  baseModule: new (...props: any[]) => any;
  plugins: Plugins;
  authMiddleware?: (req: Request) => Promise<void>;
};

export class ExpressFactory {
  private static logger = LoggerService(ExpressFactory.name);

  static async create(props: CreateParams): Promise<Express> {
    this.logger.log('Starting Express application...');

    //? ADDING MIDDLEWARES
    props.plugins.forEach((eachPlugin) => {
      this.logger.log(`Initializing {${eachPlugin.name}}`);
      props.app.use(eachPlugin);
    });

    //? ADDING MODULE CLASS
    const baseInstance = new props.baseModule();
    if (baseInstance.init) return await baseInstance.init(props.app, props.authMiddleware);

    console.error(`Invalid ${props.baseModule.name} Class, add @Module() decorator`);
    process.exit(-1);
  }
}
