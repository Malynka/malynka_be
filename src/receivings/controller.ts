import {
  Controller,
  Req,
  Get,
  Post,
  BadRequestException,
  Put,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { Receiving } from './schema';
import { ReceivingsService } from './service';
import { CreateReceivingDto, UpdateReceivingDto } from './dto';
import { ClientNotDefinedException } from './exceptions';

@Controller('receivings')
export class ReceivingsController {
  constructor(private readonly receivingsService: ReceivingsService) {}

  @Get()
  async getAll(): Promise<Receiving[]> {
    return this.receivingsService.findAll();
  }

  @Get('year/:year')
  async getByYear(
    @Req() request: Request<{ year: string }>,
  ): Promise<Receiving[]> {
    const year = Number(request.params.year);

    if (Number.isNaN(year))
      throw new BadRequestException('Year must be a number');

    return this.receivingsService.findByYear(year);
  }

  @Post()
  async create(
    @Req() request: Request<{}, {}, CreateReceivingDto>,
  ): Promise<Receiving> {
    const { body } = request;

    if (!body.client) {
      throw new BadRequestException('Client id must be provided');
    }

    if (!(Array.isArray(body.records) && body.records.length)) {
      throw new BadRequestException('Receiving records must be provided');
    }

    if (!body.timestamp) {
      throw new BadRequestException('Date timestamp must be provided');
    }

    const res: CreateReceivingDto = {
      client: body.client,
      records: body.records,
      timestamp: body.timestamp,
    };

    try {
      return await this.receivingsService.create(res);
    } catch (e) {
      if (e instanceof ClientNotDefinedException) {
        throw new BadRequestException(e.message);
      }
    }
    // return this.receivingsService.create(res);
  }

  @Put()
  async update(
    @Req() request: Request<{}, {}, UpdateReceivingDto>,
  ): Promise<Receiving> {
    const res = await this.receivingsService.update(request.body);

    if (!res)
      throw new BadRequestException(
        'Update failed. Make sure that provided receiving id is correct',
      );
    return res;
  }

  @Delete('/:id')
  async deleteById(@Req() request: Request<{ id: string }>) {
    return this.receivingsService.deleteById(request.params.id);
  }
}
