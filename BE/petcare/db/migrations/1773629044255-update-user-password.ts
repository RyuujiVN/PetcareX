import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserPassword1773629044255 implements MigrationInterface {
    name = 'UpdateUserPassword1773629044255'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."invoice_status_enum" AS ENUM('Đã thanh toán', 'Chưa thanh toán')`);
        await queryRunner.query(`CREATE TABLE "invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_owner_id" uuid NOT NULL, "medical_record_id" uuid NOT NULL, "total_amount" integer NOT NULL, "status" "public"."invoice_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`DROP TABLE "invoice"`);
        await queryRunner.query(`DROP TYPE "public"."invoice_status_enum"`);
    }

}
