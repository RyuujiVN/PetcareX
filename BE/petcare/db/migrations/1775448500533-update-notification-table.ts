import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNotificationTable1775448500533 implements MigrationInterface {
    name = 'UpdateNotificationTable1775448500533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "userId"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "user_id"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "content"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "recipient_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "sender_id" uuid`);
        await queryRunner.query(`CREATE TYPE "public"."notification_sender_type_enum" AS ENUM('USER', 'CLINIC', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "sender_type" "public"."notification_sender_type_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'AI_DIAGNOSIS', 'FOLLOW_UP_REMINDER', 'COMMENT_REPLY')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "type" "public"."notification_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "is_read" boolean NOT NULL DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "target" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_9830357f52360a126737d498e66" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_9830357f52360a126737d498e66"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "target"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "is_read"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "sender_type"`);
        await queryRunner.query(`DROP TYPE "public"."notification_sender_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "sender_id"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "recipient_id"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "content" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
