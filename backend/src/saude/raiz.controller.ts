import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiExcludeController()
@SkipThrottle()
@Controller()
export class RaizController {
  @Get()
  @Redirect('/documentacao')
  raiz() {}
}