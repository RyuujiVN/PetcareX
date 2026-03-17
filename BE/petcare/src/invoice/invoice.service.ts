import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Repository } from 'typeorm';
import { CreateInvoiceDTO } from './dtos/create-invoice.dto';
import { MedicalRecord } from 'src/medical/entities/medical-record.entity';
import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';
import { UpdateInvoiceDTO } from './dtos/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,
  ) {}

  async createInvoice(createDTO: CreateInvoiceDTO) {
    const data = await this.medicalRecordRepo
      .createQueryBuilder('medical_record')
      .leftJoin('medical_record.medicalOrders', 'medical_record_order')
      .leftJoin('medical_record_order.medicalOrder', 'medical_order')
      .leftJoin('medical_record.medicines', 'medical_record_medicine')
      .leftJoin('medical_record_medicine.medicine', 'medicine')
      .where('medical_record.id = :id', { id: createDTO.medicalRecordId })
      .select([
        'medical_record.id',

        'medical_record_order.id',
        'medical_record_order.note',
        'medical_record_order.priceAtTime',

        'medical_order.id',
        'medical_order.name',

        'medical_record_medicine.id',
        'medical_record_medicine.note',
        'medical_record_medicine.quantity',
        'medical_record_medicine.priceAtTime',

        'medicine.id',
        'medicine.name',
        'medicine.unit',
      ])
      .getOne();

    const totalCostMedicalOrders =
      data?.medicalOrders?.reduce(
        (total, value) => total + value.priceAtTime,
        0,
      ) ?? 0;

    const totalCostMedicines =
      data?.medicines?.reduce(
        (total, value) => total + value.priceAtTime * value.quantity,
        0,
      ) ?? 0;

    const invoice = new Invoice();
    invoice.petOwnerId = createDTO.petOwnerId;
    invoice.medicalRecordId = createDTO.medicalRecordId;
    invoice.totalAmount = totalCostMedicalOrders + totalCostMedicines;
    invoice.status = InvoiceStatusEnum.UNPAID;

    return await this.invoiceRepository.save(invoice);
  }

  async updateInvoice(updateDTO: UpdateInvoiceDTO, id: string) {
    const invoice = await this.invoiceRepository.findOne({ where: { id: id } });

    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn');

    Object.assign(invoice, updateDTO);

    await this.invoiceRepository.save(invoice);
  }
}
