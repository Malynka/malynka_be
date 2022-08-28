import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OwnReceiving, OwnReceivingSchema } from './schema';
import { OwnReceivingsService } from "./service";
import { OwnReceivingsController } from "./controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: OwnReceiving.name, schema: OwnReceivingSchema }])],
  controllers: [OwnReceivingsController],
  providers: [OwnReceivingsService]
})
export class OwnReceivingsModule {}