import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClinicHomepageSettingTable1775723942390 implements MigrationInterface {
    name = 'AddClinicHomepageSettingTable1775723942390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clinic_homepage_setting" ("clinic_id" uuid NOT NULL, "settings" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c038e1ec03d19256889858173a" PRIMARY KEY ("clinic_id"))`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_STATUS_UPDATED_BY_CLIENT', 'APPOINTMENT_REMINDER', 'AI_DIAGNOSIS', 'FOLLOW_UP_REMINDER', 'COMMENT_REPLY')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'AI_DIAGNOSIS', 'FOLLOW_UP_REMINDER', 'COMMENT_REPLY')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);
        await queryRunner.query(`DROP TABLE "clinic_homepage_setting"`);
    }

}
