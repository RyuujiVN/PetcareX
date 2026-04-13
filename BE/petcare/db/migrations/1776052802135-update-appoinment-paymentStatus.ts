import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAppoinmentPaymentStatus1776052802135 implements MigrationInterface {
    name = 'UpdateAppoinmentPaymentStatus1776052802135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointment_payment_status_enum" AS ENUM('PAID', 'UNPAID')`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD "payment_status" "public"."appointment_payment_status_enum" NOT NULL DEFAULT 'UNPAID'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "payment_status"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_payment_status_enum"`);
    }

}
