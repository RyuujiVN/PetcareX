import { MigrationInterface, QueryRunner } from "typeorm";

export class Int1772440155972 implements MigrationInterface {
    name = 'Int1772440155972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'ADMIN_CLINIC', 'DOCTOR', 'CUSTOMER')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "address" character varying NOT NULL DEFAULT '', "role" "public"."user_role_enum" NOT NULL, "password" character varying NOT NULL, "avatar_url" character varying, "deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clinic" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "address" character varying NOT NULL, "description" text, "deleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_050033b437380ba808c041fe730" UNIQUE ("email"), CONSTRAINT "UQ_b3df084998059e1f2f31bfd1e84" UNIQUE ("phone"), CONSTRAINT "PK_8e97c18debc9c7f7606e311d763" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_clinic" ("user_id" uuid NOT NULL, "clinic_id" uuid NOT NULL, CONSTRAINT "REL_bdac2a2eb942fbc814c1c13392" UNIQUE ("clinic_id"), CONSTRAINT "PK_4ec59939d454245093eecbcf2d3" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD CONSTRAINT "FK_4ec59939d454245093eecbcf2d3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD CONSTRAINT "FK_bdac2a2eb942fbc814c1c133929" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP CONSTRAINT "FK_bdac2a2eb942fbc814c1c133929"`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP CONSTRAINT "FK_4ec59939d454245093eecbcf2d3"`);
        await queryRunner.query(`DROP TABLE "admin_clinic"`);
        await queryRunner.query(`DROP TABLE "clinic"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
