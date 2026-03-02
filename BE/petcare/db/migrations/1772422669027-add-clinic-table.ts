import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClinicTable1772422669027 implements MigrationInterface {
    name = 'AddClinicTable1772422669027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clinic" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "address" character varying NOT NULL, "description" text, "deleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_050033b437380ba808c041fe730" UNIQUE ("email"), CONSTRAINT "UQ_b3df084998059e1f2f31bfd1e84" UNIQUE ("phone"), CONSTRAINT "PK_8e97c18debc9c7f7606e311d763" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP COLUMN "clinic_id"`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD "clinic_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD CONSTRAINT "UQ_bdac2a2eb942fbc814c1c133929" UNIQUE ("clinic_id")`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD CONSTRAINT "FK_bdac2a2eb942fbc814c1c133929" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP CONSTRAINT "FK_bdac2a2eb942fbc814c1c133929"`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP CONSTRAINT "UQ_bdac2a2eb942fbc814c1c133929"`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP COLUMN "clinic_id"`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD "clinic_id" character varying NOT NULL`);
        await queryRunner.query(`DROP TABLE "clinic"`);
    }

}
