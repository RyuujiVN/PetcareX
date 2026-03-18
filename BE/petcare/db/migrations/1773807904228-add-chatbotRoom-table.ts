import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatbotRoomTable1773807904228 implements MigrationInterface {
    name = 'AddChatbotRoomTable1773807904228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP CONSTRAINT "FK_3af52ee2d1f0c01ee39ffb696a9"`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD CONSTRAINT "FK_d9e768a6ee0814de60259975f1f" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP CONSTRAINT "FK_d9e768a6ee0814de60259975f1f"`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD CONSTRAINT "FK_3af52ee2d1f0c01ee39ffb696a9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
