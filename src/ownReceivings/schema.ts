
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type OwnReceivingDocument = OwnReceiving & Document;

@Schema({ versionKey: false })
export class OwnReceiving {
  @Prop({required: true})
  weight: number;

  @Prop({ required: true })
  timestamp: number;
}

export const OwnReceivingSchema = SchemaFactory.createForClass(OwnReceiving);