import { Model, Types } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OwnReceiving, OwnReceivingDocument } from './schema';
import { CreateOwnReceivingDto, UpdateOwnReceivingDto } from './dto';

@Injectable()
export class OwnReceivingsService {
  constructor(@InjectModel(OwnReceiving.name) private ownReceivingModel: Model<OwnReceivingDocument>) {}

  async create(createOwnReceivingDto: CreateOwnReceivingDto): Promise<OwnReceiving> {
    const ownReceiving = new this.ownReceivingModel(createOwnReceivingDto);

    return ownReceiving.save();
  }

  async findAll(): Promise<OwnReceiving[]> {
    return this.ownReceivingModel.find().exec();
  }

  async update(updateOwnReceivingDto: UpdateOwnReceivingDto): Promise<OwnReceiving> {
    return this.ownReceivingModel.findByIdAndUpdate(new Types.ObjectId(updateOwnReceivingDto.id), updateOwnReceivingDto.newData);
  }

  async delete(id: string): Promise<OwnReceiving> {
    return this.ownReceivingModel.findByIdAndDelete(new Types.ObjectId(id));
  }
}