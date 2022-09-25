
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Sale, SaleSchema } from './schema';
import { SalesService } from "./service";
import { SalesController } from "./controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }])],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService]
})
export class SalesModule {}