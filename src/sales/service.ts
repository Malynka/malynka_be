
import { Model, Types } from 'mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sale, SaleDocument } from './schema';
import { CreateSaleDto, UpdateSaleDto } from './dto';

@Injectable()
export class SalesService {
  constructor(@InjectModel(Sale.name) private saleModel: Model<SaleDocument>) {}

  async create(createOwnReceivingDto: CreateSaleDto): Promise<Sale> {
    const ownReceiving = new this.saleModel(createOwnReceivingDto);

    return ownReceiving.save();
  }

  async findAll(): Promise<Sale[]> {
    return this.saleModel.find().exec();
  }

  async findByYear(year: number): Promise<Sale[]> {
    const res = await this.saleModel.find().exec();
    return res
      .filter(({ timestamp }) => new Date(timestamp).getFullYear() === year)
      .sort((r1, r2) => r2.timestamp - r1.timestamp);
  }

  async findByRange(start: number, end: number = Date.now()) {
    return (await this.saleModel.find().exec())
      .filter((sale) => sale.timestamp >= start && sale.timestamp <= end)
      .sort((s1, s2) => s1.timestamp - s2.timestamp);
  }

  async update(updateOwnReceivingDto: UpdateSaleDto): Promise<Sale> {
    return this.saleModel.findByIdAndUpdate(new Types.ObjectId(updateOwnReceivingDto.id), updateOwnReceivingDto.newData);
  }

  async delete(id: string): Promise<Sale> {
    return this.saleModel.findByIdAndDelete(new Types.ObjectId(id));
  }
}