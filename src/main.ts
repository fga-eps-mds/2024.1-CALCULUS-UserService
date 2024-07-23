import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService()

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBIT_MQ_URI')],
      queue: configService.get<string>('RABBIT_MQ_USER_QUEUE'),
      noAck: false,
      persistent: true,
    }

  });

  await app.listen();
}
bootstrap();
