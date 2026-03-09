import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicalRecordVeterinarian1773040743270 implements MigrationInterface {
    name = 'UpdateMedicalRecordVeterinarian1773040743270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" ADD "veterinarian_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_c582cc2099f632c095bc904fab4" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_c582cc2099f632c095bc904fab4"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP COLUMN "veterinarian_id"`);
    }

}
