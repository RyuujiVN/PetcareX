import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTwoTable1773112603285 implements MigrationInterface {
    name = 'UpdateTwoTable1773112603285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ALTER COLUMN "note" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ALTER COLUMN "note" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_order" ALTER COLUMN "note" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ALTER COLUMN "note" SET NOT NULL`);
    }

}
