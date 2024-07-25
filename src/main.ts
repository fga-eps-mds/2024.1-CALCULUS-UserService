import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('Main');
const configService = new ConfigService();

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBIT_MQ_URI')],
      queue: configService.get<string>('RABBIT_MQ_USER_QUEUE'),
      noAck: false,
    },
  });
  await app.listen();
}
bootstrap();
