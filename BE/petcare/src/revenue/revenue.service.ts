import { AppointmentStatusEnum } from 'src/common/enums/appointment-status.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from 'src/appointment/entities/appointment.entity';
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
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
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

  // Tính doanh thu cho chart
  async getRevenueLineChart(options: RevenueFilterChart, clinicId: string) {
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

  async topVeterinarian(clinicId: string) {
    const today = new Date();

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(24, 0, 0, 0);

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.veterinarian', 'veterinarian')
      .innerJoin('veterinarian.user', 'user')
      .where('appointment.clinicId = :clinicId', { clinicId: clinicId })
      .andWhere('appointment.status = :status', {
        status: AppointmentStatusEnum.COMPLETED,
      })
      .andWhere('appointment.createdAt BETWEEN :start AND :end ', {
        start: start,
        end: end,
      })
      .select([
        'veterinarian.user',
        'veterinarian.specialty',

        'user.fullName',
        'user.avatarUrl',
        'user.fullName',

        'COUNT(veterinarian.userId) AS totalAppointment',
      ])
      .groupBy('veterinarian.userId, user.fullName, user.avatarUrl')
      .orderBy('totalAppointment')
      .limit(5);

    const veterinarians = await queryBuilder.getRawMany();

    return veterinarians.map((vet) => ({
      fullName: vet.user_full_name,
      avatarUrl: vet.user_avatar_url,
      id: vet.user_id,
      totalAppointment: vet.totalappointment,
      specialty: vet.veterinarian_specialty,
    }));
  }
}
