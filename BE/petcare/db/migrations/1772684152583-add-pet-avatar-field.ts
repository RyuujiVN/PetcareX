import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPetAvatarField1772684152583 implements MigrationInterface {
    name = 'AddPetAvatarField1772684152583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet" ADD "avatar" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet" DROP COLUMN "avatar"`);
    }

}
