import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatbotRoomTable1773802558593 implements MigrationInterface {
    name = 'AddChatbotRoomTable1773802558593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chatbot_room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_1af70ad48a4fbb7c9d17cfa6b39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD CONSTRAINT "FK_3af52ee2d1f0c01ee39ffb696a9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP CONSTRAINT "FK_3af52ee2d1f0c01ee39ffb696a9"`);
        await queryRunner.query(`DROP TABLE "chatbot_room"`);
    }

}
