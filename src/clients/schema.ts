import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ versionKey: false })
export class Client {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  note: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);