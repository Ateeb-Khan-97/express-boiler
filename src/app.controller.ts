import { AppService } from './app.service';
import { Controller, Post } from './utils/decorators/controller.decorator';
import { Inject } from './utils/decorators/service.decorator';

@Controller('/api/app')
export class AppController {
  constructor(
    @Inject()
    private readonly appService: AppService
  ) {}

  @Post()
  async helloWorld() {
    return 'Hello';
  }
}
