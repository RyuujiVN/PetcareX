import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateClinicLatLonField1776916803393 implements MigrationInterface {
    name = 'UpdateClinicLatLonField1776916803393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinic" ADD "lat" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "clinic" ADD "lon" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "clinic" DROP COLUMN IF EXISTS "lon"`);
        await queryRunner.query(`ALTER TABLE "clinic" DROP COLUMN IF EXISTS "lat"`);
    }

}
