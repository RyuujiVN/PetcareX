import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteRoomSessionId1774323909284 implements MigrationInterface {
    name = 'DeleteRoomSessionId1774323909284'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP COLUMN "session_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD "session_id" character varying NOT NULL`);
    }

}
