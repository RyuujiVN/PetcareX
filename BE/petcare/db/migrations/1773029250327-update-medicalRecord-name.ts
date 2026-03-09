import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicalRecordName1773029250327 implements MigrationInterface {
    name = 'UpdateMedicalRecordName1773029250327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" ADD "name" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" DROP COLUMN "name"`);
    }

}
