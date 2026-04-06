import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNotificationTable1775445602976 implements MigrationInterface {
    name = 'UpdateNotificationTable1775445602976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "recipient_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."notification_recipient_type_enum" AS ENUM('USER', 'CLINIC')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "recipient_type" "public"."notification_recipient_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "sender_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."notification_sender_type_enum" AS ENUM('USER', 'CLINIC', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "sender_type" "public"."notification_sender_type_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'AI_DIAGNOSIS', 'FOLLOW_UP_REMINDER', 'COMMENT_REPLY')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "type" "public"."notification_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "is_read" boolean NOT NULL DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "target" jsonb NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "target"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "is_read"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "sender_type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_sender_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "sender_id"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "recipient_type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_recipient_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "recipient_id"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "user_id" uuid NOT NULL`);
    }

}
