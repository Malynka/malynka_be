import { Module } from "@nestjs/common";
import { RaportController } from "./controller";
import { ReceivingsModule } from "@src/receivings/module";

@Module({
  imports: [ReceivingsModule],
  controllers: [RaportController]
})
export class RaportModule {}