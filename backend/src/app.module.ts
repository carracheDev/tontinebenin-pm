import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembresModule } from './modules/membres/membres.module';
import { ProjetsModule } from './modules/projets/projets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MembresModule,
    ProjetsModule,
  ],
})
export class AppModule {}
