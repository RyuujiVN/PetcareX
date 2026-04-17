import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReportTable1776407762321 implements MigrationInterface {
    name = 'AddReportTable1776407762321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."report_target_type_enum" AS ENUM('COMMENT', 'POST')`);
        await queryRunner.query(`CREATE TYPE "public"."report_status_enum" AS ENUM('PENDING', 'RESOLVED')`);
        await queryRunner.query(`CREATE TABLE "report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporter_id" uuid, "target_id" uuid NOT NULL, "target_type" "public"."report_target_type_enum" NOT NULL, "status" "public"."report_status_enum" NOT NULL, "reason" text NOT NULL, CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "report" ADD CONSTRAINT "FK_d41df66b60944992386ed47cf2e" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "report" DROP CONSTRAINT "FK_d41df66b60944992386ed47cf2e"`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`DROP TABLE "report"`);
        await queryRunner.query(`DROP TYPE "public"."report_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."report_target_type_enum"`);
    }

}
