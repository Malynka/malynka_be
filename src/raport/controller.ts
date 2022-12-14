import { BadRequestException, Controller, Get, Req, Inject, Res } from "@nestjs/common";
import { Request, Response } from 'express';
import { ReceivingsService } from "@src/receivings/service";
import { Receiving } from "@src/receivings/schema";
import * as ExcelJS from 'exceljs';
import { ClientsService } from "@src/clients/service";
import { SalesService } from "@src/sales/service";
import { Sale } from "@src/sales/schema";

const headerAlignment: Partial<ExcelJS.Alignment> = {
  horizontal: 'center',
  vertical: 'middle'
};

const borderSide: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: {
    argb: 'FF000000'
  }
};

const cellBorder: Partial<ExcelJS.Borders> = {
  left: borderSide,
  right: borderSide,
  top: borderSide,
  bottom: borderSide
};

@Controller('raport')
export class RaportController {
  @Inject()
  private readonly receivingsService: ReceivingsService;
  @Inject()
  private readonly clientsService: ClientsService;
  @Inject()
  private readonly salesService: SalesService;

  private calculateStats(receivings: Receiving[], sales: Sale[]) {
    const totalWeight = receivings.reduce((acc, curr) => acc + curr.totalWeight, 0);
    const totalPrice = receivings.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const allRecords = receivings.flatMap(({ records }) => records);
    const prices = allRecords.map(({ price }) => price);
    const soldWeight = sales.reduce((acc, curr) => acc + curr.weight, 0);
    const earned = sales.reduce((acc, curr) => acc + curr.weight * curr.price, 0);

    return {
      totalWeight,
      totalPrice,
      soldWeight,
      earned,
      minPrice: prices?.length ? Math.min(...prices) : 0,
      maxPrice: prices?.length ? Math.max(...prices) : 0,
      avgPrice: totalWeight ? +(totalPrice / totalWeight).toFixed(2) : 0
    };
  }

  @Get('stats')
  async getStats() {
    const receivings = await this.receivingsService.findAll();
    const sales = await this.salesService.findAll();

    return this.calculateStats(receivings, sales);
  }

  @Get('stats/:year')
  async getStatsByYear(@Req() request: Request<{ year: number }>) {
    const year = Number(request.params.year);

    if (Number.isNaN(year)) {
      throw new BadRequestException('Year must be a number');
    }

    const receivings = await this.receivingsService.findByYear(year);
    const sales = await this.salesService.findByYear(year);
    
    return this.calculateStats(receivings, sales);
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

  @Get('range')
  async getByDateRange(@Req() request: Request<{ start: number, end?: number, client?: string}>, @Res() response: Response) {
    const start = Number(request.query.start);
    const end = Number(request.query.end) || Date.now();
    const client = request.query.client ? String(request.query.client) : null;

    if (Number.isNaN(start)) {
      throw new BadRequestException('Start timestamp must be a number');
    }

    if (Number.isNaN(end)) {
      throw new BadRequestException('End timestamp must be a number');
    }
    
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const startDateString = startDate.toLocaleDateString('uk');
    const endDateString = endDate.toLocaleDateString('uk');

    const workbook = new ExcelJS.Workbook();

    workbook.creator = '??????????????';
    workbook.created = new Date();

    console.log('CLIENT', client);

    const receivings = await this.receivingsService.findByRangeAndClient(startDate.getTime(), endDate.getTime(), client);
    console.log('CONTROLLER RECEIVINGS', receivings);
    const sales = await this.salesService.findByRange(startDate.getTime(), endDate.getTime());

    await this.createReceivingsWorksheet(workbook, receivings, sales, start, end, client);

    response.attachment(`raport-${startDateString}-${endDateString}.xlsx`);
    workbook.xlsx.write(response).then(() => {
      response.end();
    });
  }

  private createCellFormula(formula: string): ExcelJS.CellSharedFormulaValue {
    return {
      formula,
      sharedFormula: formula,
      date1904: false
    };
  }

  private async createReceivingsWorksheet(
    workbook: ExcelJS.Workbook,
    receivings: Receiving[],
    sales: Sale[],
    start: number,
    end: number,
    clientId?: string
  ) {
    const client = clientId && await this.clientsService.findById(clientId);
    const stats = this.calculateStats(receivings, sales);
    const sheet = workbook.addWorksheet('????????????');

    // headers
    // ----------------------------------
    sheet.mergeCells(`A1:G1`);
    const titleCell = sheet.getCell('A1');

    titleCell.value = `???????? ?????????????? ???????????? ${start === end ? `???? ${new Date(start).toLocaleDateString('uk')}` : `?????? ${new Date(start).toLocaleDateString('uk')} ???? ${new Date(end).toLocaleDateString('uk')}${client ? ` ?????? ?????????????? ${client.name}` : ''}`}`;
    titleCell.alignment = headerAlignment;

    const gotCell = sheet.getCell('A2');
    const gotValueCell = sheet.getCell('B2');
    const spendCell = sheet.getCell('A3');
    const spendValueCell = sheet.getCell('B3');

    gotCell.value = '?????????????? (????)';
    spendCell.value = '?????????????????? (??????)';

    const soldCell = sheet.getCell('A4');
    soldCell.value = '?????????????? (????)';

    const soldValueCell = sheet.getCell('B4');

    const earnedCell = sheet.getCell('A5');
    earnedCell.value = '?????????????????? (??????)';

    const earnedValueCell = sheet.getCell('B5');

    const remainingsCell = sheet.getCell('A6');
    remainingsCell.value = '?????????????? (????)';

    const remainingsValueCell = sheet.getCell('B6');

    const profitCell = sheet.getCell('A7');
    profitCell.value = '???????????????? (??????)';

    const profitValueCell = sheet.getCell('B7');

    sheet.mergeCells('A8:A9');
    const dateHeaderCell = sheet.getCell('A8');
    dateHeaderCell.value = '????????';
    dateHeaderCell.alignment = headerAlignment;
    dateHeaderCell.border = cellBorder;
    sheet.mergeCells('B8:B9');
    const clientHeaderCell = sheet.getCell('B8');
    clientHeaderCell.value = '????????????';
    clientHeaderCell.alignment = headerAlignment;
    clientHeaderCell.border = cellBorder;

    sheet.mergeCells('C8:E8');
    const receivingsHeaderCell = sheet.getCell('C8');
    receivingsHeaderCell.value = '??????????????';
    receivingsHeaderCell.alignment = headerAlignment;
    receivingsHeaderCell.border = cellBorder;

    const weightHeaderCell = sheet.getCell('C9');
    weightHeaderCell.value = '???????? (????)';
    weightHeaderCell.alignment = headerAlignment;
    weightHeaderCell.border = cellBorder;

    const priceHeaderCell = sheet.getCell('D9');
    priceHeaderCell.value = '???????? ???? ???? (??????)';
    priceHeaderCell.alignment = headerAlignment;
    priceHeaderCell.border = cellBorder;

    const sumHeaderCell = sheet.getCell('E9');
    sumHeaderCell.value = '???????? (??????)';
    sumHeaderCell.alignment = headerAlignment;
    sumHeaderCell.border = cellBorder;

    sheet.mergeCells('F8:G8');
    const generalHeaderCell = sheet.getCell('F8');
    generalHeaderCell.value = '????????????????';
    generalHeaderCell.alignment = headerAlignment;
    generalHeaderCell.border = cellBorder;

    const generalWeightHeaderCell = sheet.getCell('F9');
    generalWeightHeaderCell.value = '???????? (????)';
    generalWeightHeaderCell.alignment = headerAlignment;
    generalWeightHeaderCell.border = cellBorder;

    const generalPriceHeaderCell = sheet.getCell('G9');
    generalPriceHeaderCell.value = '???????? (??????)';
    generalPriceHeaderCell.alignment = headerAlignment;
    generalPriceHeaderCell.border = cellBorder;
    // ---------------------------------- 

    let row = 10;

    console.log('RECEIVINGS', receivings);

    receivings.forEach((receiving) => {

      const { records } = receiving;

      const nextRow = row + records.length - 1;

      sheet.mergeCells(`A${row}:A${nextRow}`);
      const dateCell = sheet.getCell(`A${nextRow}`);
      dateCell.value = new Date(receiving.timestamp).toLocaleDateString('uk');
      dateCell.alignment = headerAlignment;
      dateCell.border = cellBorder;

      sheet.mergeCells(`B${row}:B${nextRow}`);
      const clientCell = sheet.getCell(`B${row}`);
      clientCell.value = receiving.client.name;
      clientCell.alignment = headerAlignment;
      clientCell.border = cellBorder;

      for (let i = 0; i < records.length; i++) {
        const weightCell = sheet.getCell(`C${row + i}`);
        const priceCell = sheet.getCell(`D${row + i}`);
        const sumCell = sheet.getCell(`E${row + i}`);

        const { weight, price } = records[i];

        weightCell.value = weight;
        weightCell.border = cellBorder;
        priceCell.value = price;
        priceCell.border = cellBorder;
        sumCell.value = this.createCellFormula(`${weightCell.address}*${priceCell.address}`);
        sumCell.border = cellBorder;
      }

      sheet.mergeCells(`F${row}:F${nextRow}`);
      const generalWeightCell = sheet.getCell(`F${row}`);
      generalWeightCell.value = this.createCellFormula(`SUM(C${row}:C${nextRow})`);
      generalWeightCell.alignment = headerAlignment;
      generalWeightCell.border = cellBorder;

      sheet.mergeCells(`G${row}:G${nextRow}`);
      const generalPriceCell = sheet.getCell(`G${row}`);
      generalPriceCell.value = this.createCellFormula(`SUM(E${row}:E${nextRow})`);
      generalPriceCell.alignment = headerAlignment;
      generalPriceCell.border = cellBorder;

      row += records.length;
    });

    gotValueCell.value = this.createCellFormula(`SUM(F10:F${row-1})`);
    gotValueCell.alignment = { horizontal: 'left' };
    spendValueCell.value = this.createCellFormula(`SUM(G10:G${row-1})`);
    spendValueCell.alignment = { horizontal: 'left' };

    soldValueCell.value = stats.soldWeight;
    soldValueCell.alignment = { horizontal: 'left' };
    earnedValueCell.value = stats.earned;
    earnedValueCell.alignment = { horizontal: 'left' };

    remainingsValueCell.value = this.createCellFormula('B2-B4');
    remainingsValueCell.alignment = { horizontal: 'left' };

    profitValueCell.value = this.createCellFormula('B5-B3');
    profitValueCell.alignment = { horizontal: 'left' };

    const columnsWidths = [15, 20, 15, 15 , 15, 20, 20];

    sheet.columns.forEach((c, i) => { c.width = columnsWidths[i] });

    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;
    sheet.pageSetup.firstPageNumber = 1;

    sheet.headerFooter.firstFooter = '&P/&N';
    sheet.headerFooter.evenFooter = '&P/&N';
    sheet.headerFooter.oddFooter = '&P/&N';
  }
}