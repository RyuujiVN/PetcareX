import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostTopicCommentTable1773199891678 implements MigrationInterface {
    name = 'AddPostTopicCommentTable1773199891678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "forum_topic" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b5bd8bbfc742fe036e175fff5a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "forum_post" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "author_id" uuid NOT NULL, "topic_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_35363fad61a4ba1fb0ba562b444" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "forum_comment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "parent_id" uuid, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "postId" uuid, CONSTRAINT "PK_546f92f6bc18ac7e38b22a7ee3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "forum_post" ADD CONSTRAINT "FK_4d906b6a0b54dda8e300f6b18ab" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_post" ADD CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323" FOREIGN KEY ("topic_id") REFERENCES "forum_topic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_732e640bac204520096a6901d5a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_e39f9fe7200a2327d92ebffd279" FOREIGN KEY ("postId") REFERENCES "forum_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_f91bfb678b32b237c07381515a6" FOREIGN KEY ("parent_id") REFERENCES "forum_comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_f91bfb678b32b237c07381515a6"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_e39f9fe7200a2327d92ebffd279"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_732e640bac204520096a6901d5a"`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323"`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP CONSTRAINT "FK_4d906b6a0b54dda8e300f6b18ab"`);
        await queryRunner.query(`DROP TABLE "forum_comment"`);
        await queryRunner.query(`DROP TABLE "forum_post"`);
        await queryRunner.query(`DROP TABLE "forum_topic"`);
    }

}
