import { Module } from "@nestjs/common";
import { RaportController } from "./controller";
import { ReceivingsModule } from "@src/receivings/module";
import { ClientsModule } from '@src/clients/module';
import { SalesModule } from '@src/sales/module';

@Module({
  imports: [ReceivingsModule, ClientsModule, SalesModule],
  controllers: [RaportController]
})
export class RaportModule {}