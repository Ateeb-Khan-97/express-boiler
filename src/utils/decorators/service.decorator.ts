import 'reflect-metadata';

const globalServices = new Map<string, any>();
export function Injectable(): ClassDecorator {
  return (target) => {
    const serviceName = target.name;
    if (!globalServices.has(serviceName)) {
      globalServices.set(serviceName, new (target as any)());
    } else {
      console.error(`${serviceName} named service is already injectable`);
      process.exit(-1);
    }
  };
}

export function Inject(): ParameterDecorator {
  return (target, pk, paramIndex) => {
    const existingInjectedParams: Array<new (...props: any[]) => any> =
      Reflect.getMetadata('design:paramtypes', target) || [];
    const ServiceClass = existingInjectedParams[paramIndex];
    const serviceInstance = globalServices.get(ServiceClass.name);

    if (!serviceInstance) {
      let err = `${ServiceClass.name} not found add @Injectable on it`;
      if (ServiceClass.name === 'Object') err = `@Inject didn't receive a class`;
      console.error(err);
      process.exit(-1);
    }

    existingInjectedParams[paramIndex] = serviceInstance;
    Reflect.defineMetadata('design:paramtypes', existingInjectedParams, target);
  };
}

export function injectServices<T>(cls: new (...args: any[]) => T): T {
  const paramtypes = Reflect.getMetadata('design:paramtypes', cls) || [];
  const dependencies = paramtypes.map(
    (param: any) => globalServices.get(param.constructor?.name) || param
  );
  return new cls(...dependencies);
}
