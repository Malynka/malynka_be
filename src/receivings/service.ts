import { Model, Types } from "mongoose";
import { Injectable, Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Receiving, ReceivingDocument } from "./schema";
import { ClientsService } from "../clients/service";
import { CreateReceivingDto, UpdateReceivingDto } from "./dto";
import { ClientNotDefinedException } from "./exceptions";

@Injectable()
export class ReceivingsService {
  @Inject(ClientsService)
  private readonly clientsService: ClientsService;

  constructor(@InjectModel(Receiving.name) private receivingModel: Model<ReceivingDocument>) {}

  async create(createReceivingDto: CreateReceivingDto): Promise<Receiving> {
    const client = await this.clientsService.findById(createReceivingDto.client);

    if (!client) throw new ClientNotDefinedException('Client with this id is not defined');

    const { timestamp, records } = createReceivingDto;

    const receiving = new this.receivingModel({
      client,
      records,
      timestamp,
      totalWeight: records.reduce((acc, curr) => acc + curr.weight, 0),
      totalPrice: records.map(({ weight, price }) => weight * price).reduce((acc, curr) => acc + curr)
    });

    return receiving.save();
  }

  async findAll(): Promise<Receiving[]> {
    return (await this.receivingModel.find().populate('client').exec()).sort((r1, r2) => r2.timestamp - r1.timestamp);
  }

  async findByYear(year: number): Promise<Receiving[]> {
    const res = await this.receivingModel.find().populate('client').exec();
    return res
      .filter(({ timestamp }) => new Date(timestamp).getFullYear() === year)
      .sort((r1, r2) => r2.timestamp - r1.timestamp);
  }

  async findByRangeAndClient(start: number, end: number = Date.now(), client: string = null) {
    return (await this.receivingModel.find(client ? { client } : undefined).populate('client').exec())
      .filter((r) => r.timestamp >= start && r.timestamp <= end)
      .sort((r1, r2) => r1.client.name.toLowerCase().localeCompare(r2.client.name.toLowerCase()))
      .sort((r1, r2) => r1.timestamp - r2.timestamp);
  }

  async update(updateReceivingDto: UpdateReceivingDto): Promise<Receiving> {
    return this.receivingModel.findOneAndUpdate({ _id: new Types.ObjectId(updateReceivingDto.id)}, {
      ...updateReceivingDto.newData,
      ...(updateReceivingDto.newData.records?.length ? {
        totalWeight: updateReceivingDto.newData.records.reduce((acc, curr) => acc + curr.weight, 0),
        totalPrice: updateReceivingDto.newData.records.map(({ weight, price }) => weight * price).reduce((acc, curr) => acc + curr)
      } : {})
    }, {
      new: true
    }).populate('client').exec();
  }

  async deleteById(id: string) {
    return this.receivingModel.findByIdAndRemove(new Types.ObjectId(id));
  }
}