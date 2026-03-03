import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVetinarianForeignkey1772527821511 implements MigrationInterface {
    name = 'UpdateVetinarianForeignkey1772527821511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "PK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "PK_38736e2377e763e5400653439a1" PRIMARY KEY ("user_id")`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_38736e2377e763e5400653439a1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "PK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD "user_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "PK_38736e2377e763e5400653439a1" PRIMARY KEY ("user_id")`);
    }

}
