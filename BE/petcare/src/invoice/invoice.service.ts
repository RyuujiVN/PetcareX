import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async findOneByMedicalRecordId(medicalRecordId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { medicalRecordId },
      relations: [
        'medicalRecord',
        'medicalRecord.medicalOrders',
        'medicalRecord.medicalOrders.medicalOrder',
        'medicalRecord.medicines',
        'medicalRecord.medicines.medicine',
      ],
    });

    if (!invoice)
      throw new NotFoundException('Không tìm thấy hoá đơn theo id phiếu khám');

    const medicalOrders = invoice?.medicalRecord?.medicalOrders?.map(
      (item) => ({
        id: item.id,
        note: item.note,
        priceAtTime: item.priceAtTime,
        name: item.medicalOrder.name,
      }),
    );

    const medicines =
      invoice.medicalRecord?.medicines?.map((item) => ({
        id: item.id,
        note: item.note,
        priceAtTime: item.priceAtTime,
        quantity: item.quantity,
        name: item.medicine?.name,
        unit: item.medicine?.unit,
      })) ?? [];

    const response = {
      id: invoice?.id,
      totalAmount: invoice?.totalAmount,
      note: invoice?.note,
      status: invoice?.status,
      createdAt: invoice?.createdAt,
      medicalOrders: medicalOrders,
      medicines: medicines,
    };

    return response;
  }

  async createInvoice(createDTO: CreateInvoiceDTO) {
    const medicalRecord = await this.medicalRecordRepo.findOne({
      where: { id: createDTO.medicalRecordId },
      relations: [
        'medicalOrders',
        'medicalOrders.medicalOrder',
        'medicines',
        'medicines.medicine',
      ],
    });

    if (!medicalRecord)
      throw new NotFoundException('Không tìm thấy phiếu khám');

    const totalCostMedicalOrders = medicalRecord.medicalOrders?.reduce(
      (total, value) => total + value.priceAtTime,
      0,
    );

    const totalCostMedicines = medicalRecord?.medicines?.reduce(
      (total, value) => total + value.priceAtTime * value.quantity,
      0,
    );

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

  async deleteInvoice(id: string) {
    const invoice = await this.invoiceRepository.findOne({ where: { id: id } });

    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn');

    if (invoice.status === InvoiceStatusEnum.PAID)
      throw new ForbiddenException('Hoá đơn đã thanh toán không có quyền xoá');

    await this.invoiceRepository.delete({ id: invoice.id });
  }
}
