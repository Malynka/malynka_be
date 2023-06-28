import { NestFactory } from '@nestjs/core';
import { ReceivingsService } from '@src/receivings/service';
import { AppModule } from './src/app.module';
import type { INestApplicationContext } from '@nestjs/common';

async function migrateData() {
  // console.log('Data migration is not needed. Completed successfully');
  let application: INestApplicationContext;
  try {
    application = await NestFactory.createApplicationContext(AppModule);
    const receivingsService = application.get(ReceivingsService);
    const receivings = await receivingsService.findAll();
    for (const receiving of receivings) {
      await receivingsService.update({
        id: receiving._id.toString(),
        newData: {
          client: receiving.client._id.toString(),
          records: receiving.records,
          timestamp: receiving.timestamp,
        },
      });
    }
    console.log('Data migration completed successfully.');
  } catch (error) {
    console.error('Error occurred during data migration:', error);
  } finally {
    await application.close();
    process.exit(0);
  }
}

migrateData();
