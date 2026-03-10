import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicalRecordMedicine1773123569659 implements MigrationInterface {
    name = 'UpdateMedicalRecordMedicine1773123569659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ADD "quantity" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" DROP COLUMN "quantity"`);
    }

}
