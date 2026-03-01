import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTable1772361235858 implements MigrationInterface {
    name = 'AddUserTable1772361235858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "address" character varying NOT NULL DEFAULT '', "role" "public"."user_role_enum" NOT NULL, "password" character varying NOT NULL, "avatar_url" character varying, "deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_clinic" ("user_id" uuid NOT NULL, "clinic_id" character varying NOT NULL, CONSTRAINT "PK_4ec59939d454245093eecbcf2d3" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD CONSTRAINT "FK_4ec59939d454245093eecbcf2d3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP CONSTRAINT "FK_4ec59939d454245093eecbcf2d3"`);
        await queryRunner.query(`DROP TABLE "admin_clinic"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
