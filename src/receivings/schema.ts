import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Client } from 'src/clients/schema';
import { Record } from 'src/interfaces';
import { Document, SchemaTypes, Types } from 'mongoose';

export type ReceivingDocument = Receiving & Document;

@Schema({ versionKey: false })
export class Receiving {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Client' })
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