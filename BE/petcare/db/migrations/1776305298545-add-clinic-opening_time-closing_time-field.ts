import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClinicOpeningTimeClosingTimeField1776305298545 implements MigrationInterface {
    name = 'AddClinicOpeningTimeClosingTimeField1776305298545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinic" ADD "opening_time" TIME NOT NULL DEFAULT '08:00:00'`);
        await queryRunner.query(`ALTER TABLE "clinic" ADD "closing_time" TIME NOT NULL DEFAULT '17:00:00'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "clinic" DROP COLUMN "closing_time"`);
        await queryRunner.query(`ALTER TABLE "clinic" DROP COLUMN "opening_time"`);
    }

}
