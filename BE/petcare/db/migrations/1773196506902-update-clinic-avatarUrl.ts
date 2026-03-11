import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateClinicAvatarUrl1773196506902 implements MigrationInterface {
    name = 'UpdateClinicAvatarUrl1773196506902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinic" ADD "avatar_url" character varying`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ALTER COLUMN "quantity" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ALTER COLUMN "quantity" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "clinic" DROP COLUMN "avatar_url"`);
    }

}
