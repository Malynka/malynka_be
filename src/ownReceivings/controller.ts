import { Controller, Req, Get, Post, Put, Delete, BadRequestException } from "@nestjs/common";
import { Request } from 'express';
import { OwnReceiving } from './schema';
import { OwnReceivingsService } from './service';
import { CreateOwnReceivingDto, UpdateOwnReceivingDto } from './dto';

@Controller('own_receivings')
export class OwnReceivingsController {
  constructor(
    private readonly ownReceivingsService: OwnReceivingsService
  ) {}

  @Get()
  async getAll(): Promise<OwnReceiving[]> {
    return this.ownReceivingsService.findAll();
  }

  @Post()
  async create(@Req() request: Request<{}, {}, CreateOwnReceivingDto>): Promise<OwnReceiving> {
    const { body } = request;

    try {
      return await this.ownReceivingsService.create(body);
    } catch(e) {
      throw new BadRequestException(e.message);
    }
  }

  @Put()
  async update(@Req() request: Request<{}, {}, UpdateOwnReceivingDto>): Promise<OwnReceiving> {
    const { body } = request;

    try {
      return await this.ownReceivingsService.update(body);
    } catch(e) {
      throw new BadRequestException(e.message);
    }
  }

  @Delete('/:id')
  async delete(@Req() request: Request<{ id: string }>) {
    const { id } = request.params;

    try {
      return await this.ownReceivingsService.delete(id);
    } catch(e) {
      throw new BadRequestException(e.message);
    }
  }
}