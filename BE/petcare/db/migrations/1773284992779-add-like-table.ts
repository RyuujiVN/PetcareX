import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLikeTable1773284992779 implements MigrationInterface {
    name = 'AddLikeTable1773284992779'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_732e640bac204520096a6901d5a"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_e39f9fe7200a2327d92ebffd279"`);
        await queryRunner.query(`CREATE TABLE "like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_4356ac2f9519c7404a2869f1691" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_d41caa70371e578e2a4791a88ae" FOREIGN KEY ("post_id") REFERENCES "forum_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_8f664eeb0b4b3f9c15cdb49b94f" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_ec4e454a29e0f14c7cffb9d1b11" FOREIGN KEY ("post_id") REFERENCES "forum_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_ec4e454a29e0f14c7cffb9d1b11"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_8f664eeb0b4b3f9c15cdb49b94f"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_d41caa70371e578e2a4791a88ae"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_4356ac2f9519c7404a2869f1691"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD "postId" uuid`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD "userId" uuid`);
        await queryRunner.query(`DROP TABLE "like"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_e39f9fe7200a2327d92ebffd279" FOREIGN KEY ("postId") REFERENCES "forum_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_732e640bac204520096a6901d5a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
