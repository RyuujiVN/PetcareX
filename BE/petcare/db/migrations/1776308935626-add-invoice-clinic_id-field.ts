import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvoiceClinicIdField1776308935626 implements MigrationInterface {
    name = 'AddInvoiceClinicIdField1776308935626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" ADD "clinic_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_ed1e715851899033420928d3755" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_ed1e715851899033420928d3755"`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP COLUMN "clinic_id"`);
    }

}
