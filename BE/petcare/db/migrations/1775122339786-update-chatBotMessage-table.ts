import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateChatBotMessageTable1775122339786 implements MigrationInterface {
    name = 'UpdateChatBotMessageTable1775122339786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_message" ADD "image" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_message" DROP COLUMN "image"`);
    }

}
