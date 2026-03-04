import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPetCreatedAtColumn1772605024217 implements MigrationInterface {
    name = 'AddPetCreatedAtColumn1772605024217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "note" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "note" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet" DROP COLUMN "createdAt"`);
    }

}
