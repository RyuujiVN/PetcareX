import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvoiceTable1773719843240 implements MigrationInterface {
    name = 'AddInvoiceTable1773719843240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "UQ_ba84bf442572aa3e8e46cf10e7a" UNIQUE ("medical_record_id")`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e" FOREIGN KEY ("pet_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_ba84bf442572aa3e8e46cf10e7a" FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_ba84bf442572aa3e8e46cf10e7a"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "UQ_ba84bf442572aa3e8e46cf10e7a"`);
    }

}
