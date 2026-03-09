import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicalRecordClinicId1773024835552 implements MigrationInterface {
    name = 'UpdateMedicalRecordClinicId1773024835552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_914f2b5ee433ea1f868f453df44"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP COLUMN "clinicId"`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9"`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD "clinicId" uuid`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_914f2b5ee433ea1f868f453df44" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
