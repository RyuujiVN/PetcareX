import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicalOrder1773049647040 implements MigrationInterface {
    name = 'UpdateMedicalOrder1773049647040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "medical_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "price" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c62eae711f1746ddeb1e1553420" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "medical_order"`);
    }

}
