import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtpTable1772510931910 implements MigrationInterface {
    name = 'AddOtpTable1772510931910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "otp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "email" character varying NOT NULL, "expired_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "otp"`);
    }

}
