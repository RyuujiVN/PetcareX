import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateForumCommentReplyCount1773215623677 implements MigrationInterface {
    name = 'UpdateForumCommentReplyCount1773215623677'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD "replyCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP COLUMN "replyCount"`);
    }

}
