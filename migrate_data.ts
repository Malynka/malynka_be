import { NestFactory } from '@nestjs/core';
import { ClientsService } from '@src/clients/service';
import { AppModule } from './src/app.module';
import type { INestApplicationContext } from '@nestjs/common';

async function migrateData() {
  let application: INestApplicationContext;
  try {
    application = await NestFactory.createApplicationContext(AppModule);

    const clientsService = application.get(ClientsService);

    const clients = await clientsService.findAll();

    for (const client of clients) {
      await clientsService.update(client._id.toString(), {
        isHidden: client.isHidden,
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

// Step 9: Run the migration
migrateData();
