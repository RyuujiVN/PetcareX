import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNotificationTable1775632467242 implements MigrationInterface {
    name = 'UpdateNotificationTable1775632467242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "sender_id"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "sender_type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_sender_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."notification_sender_type_enum" AS ENUM('USER', 'CLINIC', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "sender_type" "public"."notification_sender_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "sender_id" uuid`);
    }

}
