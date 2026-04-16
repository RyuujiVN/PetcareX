import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { Between, Repository } from 'typeorm';

type RevenueFilterChart = {
  dateStart: Date;
  dateEnd: Date;
  groupBy: 'DAY' | 'MONTH';
};

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  // Summary doanh thu hôm nay
  async getSummaryToday(clinicId: string) {
    const today = new Date();

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(24, 0, 0, 0);

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .where('invoice.clinicId = :clinicId', { clinicId: clinicId })
      .andWhere('invoice.status = :status', { status: InvoiceStatusEnum.PAID })
      .andWhere('invoice.createdAt BETWEEN :start AND :end ', {
        start: start,
        end: end,
      });

    const [totalCost, totalPaid, totalUnpaid] = await Promise.all([
      queryBuilder.getRawOne(),

      this.invoiceRepository.count({
        where: {
          createdAt: Between(start, end),
          status: InvoiceStatusEnum.PAID,
          clinicId: clinicId,
        },
      }),

      this.invoiceRepository.count({
        where: {
          createdAt: Between(start, end),
          status: InvoiceStatusEnum.UNPAID,
          clinicId: clinicId,
        },
      }),
    ]);

    return {
      total: Number(totalCost.total) || 0,
      totalPaid,
      totalUnpaid,
    };
  }

  async getRevenueLineChart(options: RevenueFilterChart, clinicId?: string) {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.totalAmount)', 'total')
      .where('invoice.clinicId = :clinicId', { clinicId: clinicId })
      .andWhere('invoice.status = :status', { status: InvoiceStatusEnum.PAID })
      .andWhere('invoice.createdAt BETWEEN :start AND :end ', {
        start: options.dateStart,
        end: options.dateEnd,
      });

    if (options.groupBy === 'DAY') {
      queryBuilder.addSelect('EXTRACT(DAY FROM invoice.createdAt)', 'date');
      queryBuilder.groupBy('date');
      queryBuilder.orderBy('date', 'ASC');
    } else {
      queryBuilder.addSelect('EXTRACT(MONTH FROM invoice.createdAt)', 'month');
      queryBuilder.groupBy('month');
      queryBuilder.orderBy('month', 'ASC');
    }

    return await queryBuilder.getRawMany();
  }
}
