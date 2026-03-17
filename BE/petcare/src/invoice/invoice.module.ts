import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, MedicalRecord])],
  providers: [InvoiceService],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
