import 'reflect-metadata';
import type { Handler } from 'express';

/**
 * A utility function to create custom parameter decorators.
 * @param handler A function that processes the request and returns a value to be injected.
 * @returns A parameter decorator.
 */
export function createParameterDecorator(handler: Handler) {
  return (target: any, pk: string, pi: number) => {
    const metadata = Reflect.getMetadata('metadata', target) ?? {};

    metadata['custom-decorators'] = metadata['custom-decorators']
      ? metadata['custom-decorators'].push({ index: pi, handler: handler })
      : [{ index: pi, handler: handler }];

    Reflect.defineMetadata('metadata', metadata, target[pk]);
  };
}
