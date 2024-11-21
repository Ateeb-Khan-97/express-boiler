import 'reflect-metadata';

import type { Express, Handler, Request } from 'express';
import { injectServices } from './service.decorator';
import LoggerService from '@/helper/logger.service';
import { HttpStatus } from '@/helper/http-status.constant';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BadRequestException } from '@/helper/exception.helper';

type Metadata = {
  path: string;
  method: Function;
  methodType: 'get' | 'put' | 'post' | 'patch' | 'delete';
  BodyDto?: { dto?: new (...props: any[]) => any; index: number };
  Query?: Array<{ index: number; key?: string }>;
  Param?: { key: string; index: number };
  public?: true;
  'custom-decorators'?: Array<{ index: number; handler: Handler }>;
};

export function Controller(prefix: string): ClassDecorator {
  return (target: any) => {
    process.nextTick(() => {
      const classInstance = injectServices(target);
      const metadata: Metadata[] = Reflect.getMetadata('metadata', target) ?? [];
      async function init(
        app: Express,
        protect?: (req: Request) => Promise<void>
      ): Promise<Express> {
        LoggerService('RoutesResolver').log(`${target.name} {${prefix}}`);

        for (let em of metadata) {
          const path = prefix + em.path;
          const binnedHandler = em.method.bind(classInstance);
          const handlerParameters: any[] = [];

          const validator: Handler = async (req, res, next) => {
            if (!em.BodyDto?.dto) {
              next();
            } else {
              const dtoInstance = plainToInstance(em.BodyDto.dto, req.body);
              const errors = await validate(dtoInstance);

              if (errors.length > 0) {
                const err = Object.values(errors[0].constraints ?? {})[0];
                next(new BadRequestException(err));
              }

              next();
            }
          };

          const authMiddleware: Handler = async (req, res, next) => {
            try {
              if (protect && !em.public) await protect(req);
              next();
            } catch (error) {
              next(error);
            }
          };

          const handler: Handler = async (req, res, next) => {
            if (em['custom-decorators'] && em['custom-decorators'].length > 0) {
              for (const eachDec of em['custom-decorators']) {
                handlerParameters[eachDec.index] = await eachDec.handler(req, res, next);
              }
            }

            if (em.BodyDto) handlerParameters[em.BodyDto.index] = req.body;
            if (em.Param) handlerParameters[em.Param.index] = req.params[em.Param.key];
            if (em.Query && em.Query.length > 0) {
              em.Query.forEach((eq) => {
                if (eq.key) return (handlerParameters[eq.index] = req.query[eq.key]);
                handlerParameters[eq.index] = req.query ?? {};
              });
            }

            try {
              if ((req as any)['validation_error'])
                throw new BadRequestException((req as any)['validation_error']);

              const response = await binnedHandler(...handlerParameters);
              res.status(response?.status ?? HttpStatus.OK).json(response);
            } catch (error) {
              next(error);
            }
          };

          app[em.methodType](path, authMiddleware, validator, handler);

          LoggerService('RouterExplorer').log(
            `Mapped {${path}, ${em.methodType.toUpperCase()}} route`
          );
        }

        return app;
      }

      target['init'] = init;
    });
  };
}

function httpMethodMetadataSetter(props: {
  target: any;
  handler: any;
  base: string;
  methodType: string;
}) {
  const c_metadata = Reflect.getMetadata('metadata', props.target.constructor) ?? [];
  const metadata = Reflect.getMetadata('metadata', props.handler) ?? {};

  metadata['path'] = props.base;
  metadata['method'] = props.handler;
  metadata['methodType'] = props.methodType;

  c_metadata.push(metadata);
  Reflect.defineMetadata('metadata', metadata, props.handler);
  Reflect.defineMetadata('metadata', c_metadata, props.target.constructor);
}

export function Get(base = '/'): MethodDecorator {
  return (target, pk, desc: PropertyDescriptor) => {
    process.nextTick(() =>
      httpMethodMetadataSetter({ base, target, methodType: 'get', handler: desc.value })
    );
  };
}
export function Post(base = '/'): MethodDecorator {
  return (target, pk, desc) => {
    process.nextTick(() =>
      httpMethodMetadataSetter({ base, target, methodType: 'post', handler: desc.value })
    );
  };
}
export function Put(base = '/'): MethodDecorator {
  return (target, pk, desc) => {
    process.nextTick(() =>
      httpMethodMetadataSetter({ base, target, methodType: 'put', handler: desc.value })
    );
  };
}
export function Patch(base = '/'): MethodDecorator {
  return (target, pk, desc) => {
    process.nextTick(() =>
      httpMethodMetadataSetter({ base, target, methodType: 'patch', handler: desc.value })
    );
  };
}
export function Delete(base = '/'): MethodDecorator {
  return (target, pk, desc) => {
    process.nextTick(() =>
      httpMethodMetadataSetter({ base, target, methodType: 'delete', handler: desc.value })
    );
  };
}

export function Body() {
  return (target: any, pk: string, pi: number) => {
    const [Dto] = Reflect.getMetadata('design:paramtypes', target, pk);
    const metadata = Reflect.getMetadata('metadata', target[pk]) ?? {};
    metadata['BodyDto'] = { index: pi, dto: !Dto || Dto?.name === 'Object' ? undefined : Dto };
    Reflect.defineMetadata('metadata', metadata, target[pk]);
  };
}

export function Query(key?: string) {
  return (target: any, pk: string, pi: number) => {
    const metadata = Reflect.getMetadata('metadata', target[pk]) ?? {};
    metadata['Query'] = metadata['Query']
      ? metadata['Query'].push({ index: pi, key })
      : [{ index: pi, key }];
    Reflect.defineMetadata('metadata', metadata, target[pk]);
  };
}

export function Param(key: string) {
  return (target: any, pk: string, pi: number) => {
    const metadata = Reflect.getMetadata('metadata', target[pk]) ?? {};
    metadata['Param'] = { key, index: pi };
    Reflect.defineMetadata('metadata', metadata, target[pk]);
  };
}
