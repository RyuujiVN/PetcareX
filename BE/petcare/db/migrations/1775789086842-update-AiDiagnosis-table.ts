import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAiDiagnosisTable1775789086842 implements MigrationInterface {
    name = 'UpdateAiDiagnosisTable1775789086842'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP CONSTRAINT "FK_79a381cab9e60be17562bb80117"`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP COLUMN IF EXISTS "user_id"`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP COLUMN IF EXISTS "appointment_date"`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP COLUMN IF EXISTS "appointment_time"`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD "appointment_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD CONSTRAINT "UQ_ec23bead32176acb8ac8e8e6cbb" UNIQUE ("appointment_id")`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD CONSTRAINT "FK_ec23bead32176acb8ac8e8e6cbb" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP CONSTRAINT "FK_ec23bead32176acb8ac8e8e6cbb"`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP CONSTRAINT "UQ_ec23bead32176acb8ac8e8e6cbb"`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP COLUMN "appointment_id"`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD "appointment_time" TIME NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD "appointment_date" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD CONSTRAINT "FK_79a381cab9e60be17562bb80117" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
