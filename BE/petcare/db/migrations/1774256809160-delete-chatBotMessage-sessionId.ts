import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteChatBotMessageSessionId1774256809160 implements MigrationInterface {
    name = 'DeleteChatBotMessageSessionId1774256809160'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP COLUMN IF EXISTS "session_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD "session_id" character varying`);
    }

}
