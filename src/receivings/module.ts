import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Receiving, ReceivingSchema } from "./schema";
import { ReceivingsService } from "./service";
import { ReceivingsController } from "./controller";
import { ClientsModule } from "src/clients/module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Receiving.name, schema: ReceivingSchema }]),
    ClientsModule,
  ],
  controllers: [ReceivingsController],
  providers: [ReceivingsService],
  exports: [ReceivingsService]
})
export class ReceivingsModule {}