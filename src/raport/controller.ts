import { BadRequestException, Controller, Get, Req } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Request } from 'express'
import { ReceivingsService } from "@src/receivings/service";
import { Receiving } from "@src/receivings/schema";

@Controller('raport')
export class RaportController {
  @Inject()
  private readonly receivingsService: ReceivingsService;

  private calculateStats(receivings: Receiving[]) {
    const totalWeight = receivings.reduce((acc, curr) => acc + curr.totalWeight, 0);
    const totalPrice = receivings.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const allRecords = receivings.flatMap(({ records }) => records);
    const prices = allRecords.map(({ price }) => price);

    return {
      totalWeight,
      totalPrice,
      minPrice: prices?.length ? Math.min(...prices) : 0,
      maxPrice: prices?.length ? Math.max(...prices) : 0,
      avgPrice: totalWeight ? +(totalPrice / totalWeight).toFixed(2) : 0
    };
  }

  @Get('stats')
  async getStats() {
    const res = await this.receivingsService.findAll();

    return this.calculateStats(res);
  }

  @Get('stats/:year')
  async getStatsByYear(@Req() request: Request<{ year: number }>) {
    const year = Number(request.params.year);

    if (Number.isNaN(year)) {
      throw new BadRequestException('Year must be a number');
    }

    const receivings = await this.receivingsService.findByYear(year);
    
    return this.calculateStats(receivings);
  }

  @Get('years')
  async getYears() {
    const res = await this.receivingsService.findAll();

    const years = res.map((r) => new Date(r.timestamp).getFullYear()).filter((y, i, self) => self.indexOf(y) === i).sort((a,b) => b - a);

    const actualYear = new Date(Date.now()).getFullYear();

    if (!years.includes(actualYear)) {
      years.unshift(actualYear);
    }

    return years;
  }
}