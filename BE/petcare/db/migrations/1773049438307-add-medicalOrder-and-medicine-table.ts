import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedicalOrderAndMedicineTable1773049438307 implements MigrationInterface {
  name = 'AddMedicalOrderAndMedicineTable1773049438307';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "medicine" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "unit" character varying NOT NULL, "quantity" integer NOT NULL, "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b9e0e6f37b7cadb5f402390928b" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "medicine"`);
  }
}
