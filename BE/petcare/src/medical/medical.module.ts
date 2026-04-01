import { Module } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { MedicalController } from './medical.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { UserModule } from 'src/user/user.module';
import { MedicalRecordOrder } from './entities/medical-record-order.entity';
import { MedicalRecordMedicine } from './entities/medical-record-medicine.entity';
import { MailModule } from 'src/mail/mail.module';
import { Invoice } from 'src/invoice/entities/invoice.entity';
import { BullModule } from '@nestjs/bullmq';
import { QueueNameEnum } from 'src/common/enums/queue.enum';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      MedicalRecordOrder,
      MedicalRecordMedicine,
      Invoice,
    ]),
    BullModule.registerQueue({
      name: QueueNameEnum.EMAIL,
    }),
    UserModule,
    MailModule,
  ],
  providers: [MedicalService],
  controllers: [MedicalController],
})
export class MedicalModule {}
