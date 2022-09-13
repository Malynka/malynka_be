import { Controller, Get, Post, Delete, Req, BadRequestException, Put } from '@nestjs/common';
import { ClientsService } from './service';
import { Client } from './schema';
import { Request, Response } from 'express';
import { ClientDto } from './dto';


// TODO before deleting client delete all receiving belonging to them
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async getAll(): Promise<Client[]> {
    return this.clientsService.findAll();
  }

  @Post()
  async create(@Req() request: Request<{}, {}, ClientDto>): Promise<string> {
    const { body } = request;

    if (!body.name) {
      throw new BadRequestException('Name must be non-empty string');
    }

    const clientWithThisName = await this.clientsService.findByName(body.name);

    if (clientWithThisName) {
      throw new BadRequestException('Client with this name is already created');
    }

    this.clientsService.create(body);

    return 'OK';
  }

  @Put()
  async update(@Req() request: Request): Promise<string> {
    const { body } = request;

    if (!body.id) {
      throw new BadRequestException('Id must be non-empty string');
    } 

    if (!body.name) {
      throw new BadRequestException('New name must be non-empty string');
    }

    const client = await this.clientsService.update(body.id, {
      name: body.name,
      note: body.note || ''
    });

    if (!client) {
      throw new BadRequestException('Updating failed. Make sure that client name is correct');
    }
    
    return 'OK';
  }

  @Delete('/:id')
  async deleteById(@Req() request: Request<{ id: string }>) {
    return this.clientsService.deleteById(request.params.id);
  }
}