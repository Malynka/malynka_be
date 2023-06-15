import {
  BadRequestException,
  Controller,
  Get,
  Req,
  Inject,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ReceivingsService } from '@src/receivings/service';
import { Receiving } from '@src/receivings/schema';
import * as ExcelJS from 'exceljs';
import { ClientsService } from '@src/clients/service';
import { SalesService } from '@src/sales/service';
import { Sale } from '@src/sales/schema';

const headerAlignment: Partial<ExcelJS.Alignment> = {
  horizontal: 'center',
  vertical: 'middle',
};

const borderSide: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: {
    argb: 'FF000000',
  },
};

const cellBorder: Partial<ExcelJS.Borders> = {
  left: borderSide,
  right: borderSide,
  top: borderSide,
  bottom: borderSide,
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
    const totalWeight = receivings.reduce(
      (acc, curr) => acc + curr.totalWeight,
      0,
    );
    const totalPrice = receivings.reduce(
      (acc, curr) => acc + curr.totalPrice,
      0,
    );
    const allRecords = receivings.flatMap(({ records }) => records);
    const prices = allRecords.map(({ price }) => price);
    const soldWeight = sales.reduce((acc, curr) => acc + curr.weight, 0);
    const earned = sales.reduce(
      (acc, curr) => acc + curr.weight * curr.price,
      0,
    );

    return {
      totalWeight,
      totalPrice,
      soldWeight,
      earned,
      minPrice: prices?.length ? Math.min(...prices) : 0,
      maxPrice: prices?.length ? Math.max(...prices) : 0,
      avgPrice: totalWeight ? +(totalPrice / totalWeight).toFixed(2) : 0,
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

    const years = res
      .map((r) => new Date(r.timestamp).getFullYear())
      .filter((y, i, self) => self.indexOf(y) === i)
      .sort((a, b) => b - a);

    const actualYear = new Date(Date.now()).getFullYear();

    if (!years.includes(actualYear)) {
      years.unshift(actualYear);
    }

    return years;
  }

  @Get('range')
  async getByDateRange(
    @Req() request: Request<{ start: number; end?: number; client?: string }>,
    @Res() response: Response,
  ) {
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

    workbook.creator = 'Малинка';
    workbook.created = new Date();

    const receivings = await this.receivingsService.findByRangeAndClient(
      startDate.getTime(),
      endDate.getTime(),
      client,
    );
    const sales = await this.salesService.findByRange(
      startDate.getTime(),
      endDate.getTime(),
    );

    await this.createReceivingsWorksheet(
      workbook,
      receivings,
      start,
      end,
      client,
    );

    response.attachment(
      `hello-raport-${startDateString}-${endDateString}.xlsx`,
    );
    workbook.xlsx.write(response).then(() => {
      response.end();
    });
  }

  private createCellFormula(formula: string): ExcelJS.CellSharedFormulaValue {
    return {
      formula,
      sharedFormula: formula,
      date1904: false,
    };
  }

  private async createReceivingsWorksheet(
    workbook: ExcelJS.Workbook,
    receivings: Receiving[],
    start: number,
    end: number,
    clientId?: string,
  ) {
    const client = clientId && (await this.clientsService.findById(clientId));
    const sheet = workbook.addWorksheet('Малина');

    // headers
    // ----------------------------------
    sheet.mergeCells(`A1:G1`);
    const titleCell = sheet.getCell('A1');

    titleCell.value = `Звіт прийому малини ${
      start === end
        ? `за ${new Date(start).toLocaleDateString('uk')}`
        : `від ${new Date(start).toLocaleDateString('uk')} до ${new Date(
            end,
          ).toLocaleDateString('uk')}${
            client ? ` від клієнта ${client.name}` : ''
          }`
    }`;
    titleCell.alignment = headerAlignment;

    const gotCell = sheet.getCell('A2');
    gotCell.value = 'Зібрано (кг)';

    const gotValueCell = sheet.getCell('B2');

    const spendCell = sheet.getCell('A3');
    spendCell.value = 'Витрачено (грн)';

    const spendValueCell = sheet.getCell('B3');

    const maxPriceCell = sheet.getCell('A4');
    maxPriceCell.value = 'Максимальна (грн/кг)';

    const maxPriceValueCell = sheet.getCell('B4');

    const minPriceCell = sheet.getCell('A5');
    minPriceCell.value = 'Мінімальна (грн/кг)';

    const minPriceValueCell = sheet.getCell('B5');

    const avgPriceCell = sheet.getCell('A6');
    avgPriceCell.value = 'Середня (грн/кг)';

    const avgPriceValueCell = sheet.getCell('B6');

    sheet.mergeCells('A8:A9');
    const dateHeaderCell = sheet.getCell('A8');
    dateHeaderCell.value = 'Дата';
    dateHeaderCell.alignment = headerAlignment;
    dateHeaderCell.border = cellBorder;
    sheet.mergeCells('B8:B9');
    const clientHeaderCell = sheet.getCell('B8');
    clientHeaderCell.value = 'Клієнт';
    clientHeaderCell.alignment = headerAlignment;
    clientHeaderCell.border = cellBorder;

    sheet.mergeCells('C8:E8');
    const receivingsHeaderCell = sheet.getCell('C8');
    receivingsHeaderCell.value = 'Прийоми';
    receivingsHeaderCell.alignment = headerAlignment;
    receivingsHeaderCell.border = cellBorder;

    const weightHeaderCell = sheet.getCell('C9');
    weightHeaderCell.value = 'Вага (кг)';
    weightHeaderCell.alignment = headerAlignment;
    weightHeaderCell.border = cellBorder;

    const priceHeaderCell = sheet.getCell('D9');
    priceHeaderCell.value = 'Ціна за кг (грн)';
    priceHeaderCell.alignment = headerAlignment;
    priceHeaderCell.border = cellBorder;

    const sumHeaderCell = sheet.getCell('E9');
    sumHeaderCell.value = 'Сума (грн)';
    sumHeaderCell.alignment = headerAlignment;
    sumHeaderCell.border = cellBorder;

    sheet.mergeCells('F8:G8');
    const generalHeaderCell = sheet.getCell('F8');
    generalHeaderCell.value = 'Загальні';
    generalHeaderCell.alignment = headerAlignment;
    generalHeaderCell.border = cellBorder;

    const generalWeightHeaderCell = sheet.getCell('F9');
    generalWeightHeaderCell.value = 'Вага (кг)';
    generalWeightHeaderCell.alignment = headerAlignment;
    generalWeightHeaderCell.border = cellBorder;

    const generalPriceHeaderCell = sheet.getCell('G9');
    generalPriceHeaderCell.value = 'Сума (грн)';
    generalPriceHeaderCell.alignment = headerAlignment;
    generalPriceHeaderCell.border = cellBorder;
    // ----------------------------------

    let row = 10;

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
        weightCell.numFmt = '#,##0.00';

        priceCell.value = price;
        priceCell.border = cellBorder;
        priceCell.numFmt = '#,##0.00';

        sumCell.value = this.createCellFormula(
          `${weightCell.address}*${priceCell.address}`,
        );
        sumCell.border = cellBorder;
        sumCell.numFmt = '#,##0.00';
      }

      sheet.mergeCells(`F${row}:F${nextRow}`);
      const generalWeightCell = sheet.getCell(`F${row}`);
      generalWeightCell.value = this.createCellFormula(
        `SUM(C${row}:C${nextRow})`,
      );
      generalWeightCell.alignment = headerAlignment;
      generalWeightCell.border = cellBorder;
      generalWeightCell.numFmt = '#,##0.00';

      sheet.mergeCells(`G${row}:G${nextRow}`);
      const generalPriceCell = sheet.getCell(`G${row}`);
      generalPriceCell.value = this.createCellFormula(
        `SUM(E${row}:E${nextRow})`,
      );
      generalPriceCell.alignment = headerAlignment;
      generalPriceCell.border = cellBorder;
      generalPriceCell.numFmt = '#,##0.00';

      row += records.length;
    });

    gotValueCell.value = this.createCellFormula(`SUM(F10:F${row - 1})`);
    gotValueCell.alignment = { horizontal: 'left' };
    gotValueCell.numFmt = '#,##0.00';

    spendValueCell.value = this.createCellFormula(`SUM(G10:G${row - 1})`);
    spendValueCell.alignment = { horizontal: 'left' };
    spendValueCell.numFmt = '#,##0.00';

    maxPriceValueCell.value = this.createCellFormula(`MAX(D10:D${row - 1})`);
    maxPriceValueCell.alignment = { horizontal: 'left' };
    maxPriceValueCell.numFmt = '#,##0.00';

    minPriceValueCell.value = this.createCellFormula(`MIN(D10:D${row - 1})`);
    minPriceValueCell.alignment = { horizontal: 'left' };
    minPriceValueCell.numFmt = '#,##0.00';

    avgPriceValueCell.value = this.createCellFormula('B3/B2');
    avgPriceValueCell.alignment = { horizontal: 'left' };
    avgPriceValueCell.numFmt = '#,##0.00';

    const columnsWidths = [15, 20, 15, 15, 15, 20, 20];

    sheet.columns.forEach((c, i) => {
      c.width = columnsWidths[i];
    });

    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;
    sheet.pageSetup.firstPageNumber = 1;

    sheet.headerFooter.firstFooter = '&P/&N';
    sheet.headerFooter.evenFooter = '&P/&N';
    sheet.headerFooter.oddFooter = '&P/&N';
  }
}
