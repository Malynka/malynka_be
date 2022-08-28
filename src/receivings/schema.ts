import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Client } from 'src/clients/schema';
import { Record } from 'src/interfaces';


export type ReceivingDocument = Receiving & mongoose.Document;

@Schema({ versionKey: false })
export class Receiving {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Client' })
  client: Client;

  @Prop({ required: true })
  records: Record[];

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  totalWeight: number;

  @Prop({ required: true })
  totalPrice: number;
}

export const ReceivingSchema = SchemaFactory.createForClass(Receiving);