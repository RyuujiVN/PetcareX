import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVeterinarianField1776407933397 implements MigrationInterface {
    name = 'UpdateVeterinarianField1776407933397'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD "experience" character varying`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD "introduce" text`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP COLUMN IF EXISTS "introduce"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP COLUMN IF EXISTS "experience"`);
    }

}
