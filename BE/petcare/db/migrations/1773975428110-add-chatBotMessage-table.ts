import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatBotMessageTable1773975428110 implements MigrationInterface {
    name = 'AddChatBotMessageTable1773975428110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."chatbot_message_send_by_enum" AS ENUM('USER', 'AI')`);
        await queryRunner.query(`CREATE TABLE "chatbot_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "send_by" "public"."chatbot_message_send_by_enum" NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_540ae77b11241dc8e0fd49bccaa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD "session_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chatbot_message" ADD CONSTRAINT "FK_cfe088b2256249ffb941b02e0dd" FOREIGN KEY ("room_id") REFERENCES "chatbot_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_message" DROP CONSTRAINT "FK_cfe088b2256249ffb941b02e0dd"`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP COLUMN "session_id"`);
        await queryRunner.query(`DROP TABLE "chatbot_message"`);
        await queryRunner.query(`DROP TYPE "public"."chatbot_message_send_by_enum"`);
    }

}
