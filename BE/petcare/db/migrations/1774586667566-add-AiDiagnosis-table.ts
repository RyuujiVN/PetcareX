import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiDiagnosisTable1774586667566 implements MigrationInterface {
    name = 'AddAiDiagnosisTable1774586667566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ai_diagnosis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "pet_id" uuid NOT NULL, "diagnosis" character varying NOT NULL, "appointment_date" date NOT NULL, "appointment_time" TIME NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_23901c996cdc5a1275055a7b759" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD CONSTRAINT "FK_79a381cab9e60be17562bb80117" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" ADD CONSTRAINT "FK_8b95e356fd65e5c8498c04a53e1" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP CONSTRAINT "FK_8b95e356fd65e5c8498c04a53e1"`);
        await queryRunner.query(`ALTER TABLE "ai_diagnosis" DROP CONSTRAINT "FK_79a381cab9e60be17562bb80117"`);
        await queryRunner.query(`DROP TABLE "ai_diagnosis"`);
    }

}
