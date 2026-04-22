import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateForumPostImagesField1776759375682 implements MigrationInterface {
    name = 'UpdateForumPostImagesField1776759375682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_post" ADD "images" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP COLUMN "images"`);
    }

}
