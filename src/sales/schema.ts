import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SaleDocument = Sale & Document;

@Schema({ versionKey: false })
export class Sale {
  @Prop({required: true})
  weight: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  timestamp: number;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);