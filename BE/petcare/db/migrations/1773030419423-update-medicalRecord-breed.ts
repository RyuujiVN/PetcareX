import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicalRecordBreed1773030419423 implements MigrationInterface {
    name = 'UpdateMedicalRecordBreed1773030419423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" DROP COLUMN "breedId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" ADD "breedId" uuid NOT NULL`);
    }

}
