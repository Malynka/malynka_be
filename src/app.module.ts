import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from './clients/module';
import { ReceivingsModule } from './receivings/module';
import { OwnReceivingsModule } from './ownReceivings/module';
import { RaportModule } from './raport/module';
import { SalesModule } from './sales/module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/malynkadb', {}),
    ClientsModule,
    ReceivingsModule,
    OwnReceivingsModule,
    RaportModule,
    SalesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
