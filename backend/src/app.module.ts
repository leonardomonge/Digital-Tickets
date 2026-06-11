import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { CategoriesModule } from './categories/categories.module';
import { RecordsModule } from './records/records.module';
import { ScheduleModule } from './schedule/schedule.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  
  imports: [ConfigModule.forRoot({ isGlobal: true }),PrismaModule.forRoot(),AuthModule, UsersModule, EmployeesModule, CategoriesModule, RecordsModule, ScheduleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
