import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePetTable1773038700501 implements MigrationInterface {
    name = 'UpdatePetTable1773038700501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "gender" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "date_of_birth" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "weight" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "weight" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "date_of_birth" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "gender" SET NOT NULL`);
    }

}
