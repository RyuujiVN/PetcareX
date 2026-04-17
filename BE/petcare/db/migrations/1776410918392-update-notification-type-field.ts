import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNotificationTypeField1776410918392 implements MigrationInterface {
    name = 'UpdateNotificationTypeField1776410918392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_STATUS_UPDATED_BY_CLIENT', 'APPOINTMENT_REMINDER', 'REPORT', 'AI_DIAGNOSIS', 'FOLLOW_UP_REMINDER_BEFORE_TWO_DAYS', 'FOLLOW_UP_REMINDER_TODAY', 'COMMENT', 'COMMENT_REPLY', 'LIKE')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_STATUS_UPDATED_BY_CLIENT', 'APPOINTMENT_REMINDER', 'AI_DIAGNOSIS', 'FOLLOW_UP_REMINDER_BEFORE_TWO_DAYS', 'FOLLOW_UP_REMINDER_TODAY', 'COMMENT', 'COMMENT_REPLY', 'LIKE')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);
    }

}
