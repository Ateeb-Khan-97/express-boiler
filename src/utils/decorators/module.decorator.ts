import { NotFoundException } from '@/helper/exception.helper';
import type { Express, Handler } from 'express';
type Controllers = new (...props: any[]) => any;

export function Module(props: { controllers: Controllers[] }): ClassDecorator {
  return (target) => {
    Reflect.defineProperty(target.prototype, 'init', {
      value: async (app: Express, authMiddleware?: (req: Request) => Promise<void>) => {
        return new Promise((resolve, reject) => {
          if (!app) reject('Express app not found');
          process.nextTick(() => {
            props.controllers.forEach((ec: any) => {
              if (ec?.init) return ec.init(app, authMiddleware);

              const error = `Invalid controller class ${ec?.name}, are you sure it has @Controller decorator`;
              console.error(error);
              process.exit(-1);
            });

            app.all('*', () => {
              throw new NotFoundException('Route not found');
            });
            resolve(app);
          });
        });
      },
      writable: true,
      configurable: true,
    });
  };
}
