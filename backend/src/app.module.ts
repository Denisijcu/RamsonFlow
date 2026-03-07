import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { WorkflowsModule } from './workflows/workflows.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // Carga el .env automáticamente en process.env para todos los módulos
    NestConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    WorkflowsModule,
    AuthModule,
    ConfigModule,
    ChatModule,
  ],
})
export class AppModule {}