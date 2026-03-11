import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateForumPostCommentCountLikeCount1773209488101 implements MigrationInterface {
    name = 'UpdateForumPostCommentCountLikeCount1773209488101'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_post" ADD "comment_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "forum_post" ADD "like_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "forum_topic" ADD CONSTRAINT "UQ_a7247cb5c3821e56b274322ed86" UNIQUE ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_topic" DROP CONSTRAINT "UQ_a7247cb5c3821e56b274322ed86"`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP COLUMN "like_count"`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP COLUMN "comment_count"`);
    }

}
