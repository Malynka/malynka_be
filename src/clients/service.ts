import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Client, ClientDocument } from './schema';
import { ClientDto } from './dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
  ) {}

  async create(clientDto: ClientDto): Promise<Client> {
    const createdClient = new this.clientModel(clientDto);

    return createdClient.save();
  }

  async findAll(): Promise<Client[]> {
    return (await this.clientModel.find().exec())
      .filter((c) => !c.isHidden)
      .sort((c1, c2) =>
        c1.name.toLowerCase().localeCompare(c2.name.toLowerCase()),
      );
  }

  async findByName(name: string): Promise<Client | null> {
    return this.clientModel.findOne({ name }).exec();
  }

  async findById(id: string): Promise<Client | null> {
    return this.clientModel.findOne({ _id: new Types.ObjectId(id) }).exec();
  }

  async update(id: string, newData: Partial<ClientDto>): Promise<Client> {
    return this.clientModel.findByIdAndUpdate(id, newData).exec();
  }

  async deleteById(id: string) {
    return this.clientModel.findByIdAndUpdate(id, { isHidden: true }).exec();
  }
}
