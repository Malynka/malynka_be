
import { Controller, Req, Get, Post, Put, Delete, BadRequestException } from "@nestjs/common";
import { Request } from 'express';
import { Sale } from './schema';
import { SalesService } from './service';
import { CreateSaleDto, UpdateSaleDto } from './dto';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService
  ) {}

  @Get()
  async getAll(): Promise<Sale[]> {
    return this.salesService.findAll();
  }

  @Get('year')
  async getByAllYears() {
    return this.salesService.findAll();
  }

  @Get('year/:year')
  async getByYear(@Req() request: Request<{ year: string }>) {
    const year = Number(request.params.year);

    if (Number.isNaN(year)) {
      throw new BadRequestException('year must be a number');
    }

    return this.salesService.findByYear(year);
  }

  @Post()
  async create(@Req() request: Request<{}, {}, CreateSaleDto>): Promise<Sale> {
    const { body } = request;

    try {
      return await this.salesService.create(body);
    } catch(e) {
      throw new BadRequestException(e.message);
    }
  }

  @Put()
  async update(@Req() request: Request<{}, {}, UpdateSaleDto>): Promise<Sale> {
    const { body } = request;

    try {
      return await this.salesService.update(body);
    } catch(e) {
      throw new BadRequestException(e.message);
    }
  }

  @Delete('/:id')
  async delete(@Req() request: Request<{ id: string }>) {
    const { id } = request.params;

    try {
      return await this.salesService.delete(id);
    } catch(e) {
      throw new BadRequestException(e.message);
    }
  }
}