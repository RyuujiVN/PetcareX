import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClinicReviewTable1776147867624 implements MigrationInterface {
    name = 'AddClinicReviewTable1776147867624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clinic_review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clinic_id" uuid NOT NULL, "user_id" uuid, "medical_record_id" uuid NOT NULL, "rating" numeric(2,1) NOT NULL, "content" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b0de806fa147e9ef90b1808aeea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD "is_review" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "clinic" ADD "avgRating" numeric(2,1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "clinic" ADD "totalReviews" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "clinic_review" ADD CONSTRAINT "FK_d2f3d708025a51dbd2edac1843c" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clinic_review" ADD CONSTRAINT "FK_99e3bd70b4accdcb612dc9a83e6" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clinic_review" ADD CONSTRAINT "FK_b82756269c1f24e86b241e02098" FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "clinic_review" DROP CONSTRAINT "FK_b82756269c1f24e86b241e02098"`);
        await queryRunner.query(`ALTER TABLE "clinic_review" DROP CONSTRAINT "FK_99e3bd70b4accdcb612dc9a83e6"`);
        await queryRunner.query(`ALTER TABLE "clinic_review" DROP CONSTRAINT "FK_d2f3d708025a51dbd2edac1843c"`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "is_read" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "clinic" DROP COLUMN "totalReviews"`);
        await queryRunner.query(`ALTER TABLE "clinic" DROP COLUMN "avgRating"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP COLUMN "is_review"`);
        await queryRunner.query(`DROP TABLE "clinic_review"`);
    }

}
