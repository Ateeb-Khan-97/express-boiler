import { Injectable } from './utils/decorators/service.decorator';

@Injectable()
export class AppService {
  helloExpress() {
    console.log('Hello Express');
  }
}
