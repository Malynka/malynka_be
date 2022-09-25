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

    if (end < start) {
      throw new BadRequestException('End timestamp must be greater that start one');
    }

    const startDateString = new Date(start).toLocaleDateString('uk');
    const endDateString = new Date(end).toLocaleDateString('uk');

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Малинка';
    workbook.created = new Date();

    const receivings = await this.receivingsService.findByRangeAndClient(start, end, client);

    await this.createReceivingsWorksheet(workbook, receivings, start, end, client);

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
    start: number,
    end: number,
    clientId?: string
  ) {
    const client = clientId && await this.clientsService.findById(clientId);
    const sheet = workbook.addWorksheet('Малина');

    // headers
    // ----------------------------------
    sheet.mergeCells(`A1:G1`);
    const titleCell = sheet.getCell('A1');



    titleCell.value = `Звіт прийому малини ${start === end ? `за ${new Date(start).toLocaleDateString('uk')}` : `від ${new Date(start).toLocaleDateString('uk')} до ${new Date(end).toLocaleDateString('uk')}${client ? ` від клієнта ${client.name}` : ''}`}`;
    titleCell.alignment = headerAlignment;

    const gotCell = sheet.getCell('A2');
    const gotValueCell = sheet.getCell('B2');
    const spendCell = sheet.getCell('A3');
    const spendValueCell = sheet.getCell('B3');

    gotCell.value = 'Зібрано (кг)';
    spendCell.value = 'Витрачено (грн)';

    // const soldCell = sheet.getCell('A4');
    // const soldValueCell = sheet.getCell('B4');
    // const earnedCell = sheet.getCell('A5');
    // const earnedValueCell = sheet.getCell('B5');
    // const remainingsCell = sheet.getCell('A6');
    // const remainingsValueCell = sheet.getCell('B6');
    // const profitCell = sheet.getCell('A7');
    // const profitValueCell = sheet.getCell('B7');

    sheet.mergeCells('A4:A5');
    const dateHeaderCell = sheet.getCell('A4');
    dateHeaderCell.value = 'Дата';
    dateHeaderCell.alignment = headerAlignment;
    dateHeaderCell.border = cellBorder;
    sheet.mergeCells('B4:B5');
    const clientHeaderCell = sheet.getCell('B4');
    clientHeaderCell.value = 'Клієнт';
    clientHeaderCell.alignment = headerAlignment;
    clientHeaderCell.border = cellBorder;

    sheet.mergeCells('C4:E4');
    const receivingsHeaderCell = sheet.getCell('C4');
    receivingsHeaderCell.value = 'Прийоми';
    receivingsHeaderCell.alignment = headerAlignment;
    receivingsHeaderCell.border = cellBorder;

    const weightHeaderCell = sheet.getCell('C5');
    weightHeaderCell.value = 'Вага (кг)';
    weightHeaderCell.alignment = headerAlignment;
    weightHeaderCell.border = cellBorder;

    const priceHeaderCell = sheet.getCell('D5');
    priceHeaderCell.value = 'Ціна за кг (грн)';
    priceHeaderCell.alignment = headerAlignment;
    priceHeaderCell.border = cellBorder;

    const sumHeaderCell = sheet.getCell('E5');
    sumHeaderCell.value = 'Сума (грн)';
    sumHeaderCell.alignment = headerAlignment;
    sumHeaderCell.border = cellBorder;

    sheet.mergeCells('F4:G4');
    const generalHeaderCell = sheet.getCell('F4');
    generalHeaderCell.value = 'Загальні';
    generalHeaderCell.alignment = headerAlignment;
    generalHeaderCell.border = cellBorder;

    const generalWeightHeaderCell = sheet.getCell('F5');
    generalWeightHeaderCell.value = 'Вага (кг)';
    generalWeightHeaderCell.alignment = headerAlignment;
    generalWeightHeaderCell.border = cellBorder;

    const generalPriceHeaderCell = sheet.getCell('G5');
    generalPriceHeaderCell.value = 'Ціна (грн)';
    generalPriceHeaderCell.alignment = headerAlignment;
    generalPriceHeaderCell.border = cellBorder;
    // ---------------------------------- 

    let row = 6;

    receivings.forEach((receiving, index) => {

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

    gotValueCell.value = this.createCellFormula(`SUM(F6:F${row-1}`);
    gotValueCell.alignment = { horizontal: 'left' };
    spendValueCell.value = this.createCellFormula(`SUM(G6:G${row-1})`);
    spendValueCell.alignment = { horizontal: 'left' };

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