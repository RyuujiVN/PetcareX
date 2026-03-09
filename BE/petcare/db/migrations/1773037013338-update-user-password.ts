import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserPassword1773037013338 implements MigrationInterface {
    name = 'UpdateUserPassword1773037013338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`);
    }

}
