import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ versionKey: false })
export class Client {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: false })
  isHidden: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
