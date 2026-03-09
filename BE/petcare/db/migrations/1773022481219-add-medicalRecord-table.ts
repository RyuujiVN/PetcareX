import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMedicalRecordTable1773022481219 implements MigrationInterface {
    name = 'AddMedicalRecordTable1773022481219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "medical_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid NOT NULL, "clinic_id" uuid NOT NULL, "temperature" numeric(3,1) NOT NULL, "heart_rate" integer NOT NULL, "systolic" integer NOT NULL, "diastolic" integer NOT NULL, "weight" numeric(3,1) NOT NULL, "diagnosis" character varying NOT NULL, "symptoms" character varying NOT NULL, "conclusion" character varying, "note" text, "follow_up_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "clinicId" uuid, CONSTRAINT "PK_d96ede886356ac47ddcbb0bf3a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_aa2a027f6713844ca536c106992" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_914f2b5ee433ea1f868f453df44" FOREIGN KEY ("clinicId") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_914f2b5ee433ea1f868f453df44"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_aa2a027f6713844ca536c106992"`);
        await queryRunner.query(`DROP TABLE "medical_record"`);
    }

}
