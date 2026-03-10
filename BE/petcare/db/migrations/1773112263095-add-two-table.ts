import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwoTable1773112263095 implements MigrationInterface {
    name = 'AddTwoTable1773112263095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "medical_record_medicine" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medical_record_id" uuid NOT NULL, "medicine_id" uuid NOT NULL, "note" text NOT NULL, "price_at_time" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8278ae363db7158b0e0c61faa4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_record_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medical_record_id" uuid NOT NULL, "medical_order_id" uuid NOT NULL, "note" text NOT NULL, "price_at_time" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e4d8d2680ca2072f3c662ed29b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ADD CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ADD CONSTRAINT "FK_83fe2d52334635b2305b6d4daf9" FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ADD CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593" FOREIGN KEY ("medical_order_id") REFERENCES "medical_order"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ADD CONSTRAINT "FK_4f0a7f032b7cee6d07d81ad2332" FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record_order" DROP CONSTRAINT "FK_4f0a7f032b7cee6d07d81ad2332"`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" DROP CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593"`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" DROP CONSTRAINT "FK_83fe2d52334635b2305b6d4daf9"`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" DROP CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42"`);
        await queryRunner.query(`DROP TABLE "medical_record_order"`);
        await queryRunner.query(`DROP TABLE "medical_record_medicine"`);
    }

}
