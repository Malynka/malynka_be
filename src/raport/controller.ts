import { Controller, Get, Req } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Request } from 'express'
import { ReceivingsService } from "@src/receivings/service";

@Controller('raport')
export class RaportController {
  @Inject()
  private readonly receivingsService: ReceivingsService;
  
  @Get('stats')
  async getAll() {
    const res = await this.receivingsService.findAll();

    return {
      totalWeight: res.reduce((acc, curr) => acc + curr.totalWeight, 0),
      totalPrice: res.reduce((acc, curr) => acc + curr.totalPrice, 0)
    };
  }
}