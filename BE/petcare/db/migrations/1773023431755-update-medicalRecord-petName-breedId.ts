import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicalRecordPetNameBreedId1773023431755 implements MigrationInterface {
    name = 'UpdateMedicalRecordPetNameBreedId1773023431755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" ADD "pet_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD "breedId" uuid NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" DROP COLUMN "breedId"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP COLUMN "pet_name"`);
    }

}
