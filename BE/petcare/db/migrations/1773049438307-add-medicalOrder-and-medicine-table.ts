import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMedicalOrderAndMedicineTable1773049438307 implements MigrationInterface {
    name = 'AddMedicalOrderAndMedicineTable1773049438307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "medicine" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "unit" character varying NOT NULL, "quantity" integer NOT NULL, "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b9e0e6f37b7cadb5f402390928b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical-order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "price" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c2edd1b7d2d24a358d91d372a6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "medical-order"`);
        await queryRunner.query(`DROP TABLE "medicine"`);
    }

}
