import { createParameterDecorator } from '@/config/create-decorator';
import { UnauthorizedException } from '@/helper/exception.helper';
import type { Request } from 'express';

export async function protectMiddleware(req: Request): Promise<void> {
  const authHeader = req.headers.authorization;
  //   if (!authHeader || !authHeader.startsWith('Bearer')) throw new UnauthorizedException();

  //   const [, token] = authHeader.split(' ');
  //   if (!token) throw new UnauthorizedException();

  (req as any)['user'] = 1;
}

export const Public = () => {
  return (target: any, pk: string, desc: any) => {
    const metadata = Reflect.getMetadata('metadata', desc.value) ?? {};
    metadata['public'] = true;
    Reflect.defineMetadata('metadata', metadata, desc.value);
  };
};

export const CurrentUser = createParameterDecorator((req: any) => req['user']);
