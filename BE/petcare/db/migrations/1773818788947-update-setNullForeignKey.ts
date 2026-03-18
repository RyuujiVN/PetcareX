import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSetNullForeignKey1773818788947 implements MigrationInterface {
    name = 'UpdateSetNullForeignKey1773818788947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_post" DROP CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323"`);
        await queryRunner.query(`ALTER TABLE "forum_post" ALTER COLUMN "topic_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e"`);
        await queryRunner.query(`ALTER TABLE "invoice" ALTER COLUMN "pet_owner_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet" DROP CONSTRAINT "FK_68847e00bd32e8e3ec835e397c8"`);
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "breed_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" DROP CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42"`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ALTER COLUMN "medicine_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" DROP CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593"`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ALTER COLUMN "medical_order_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_aa2a027f6713844ca536c106992"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_c582cc2099f632c095bc904fab4"`);
        await queryRunner.query(`ALTER TABLE "medical_record" ALTER COLUMN "pet_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" ALTER COLUMN "clinic_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" ALTER COLUMN "veterinarian_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_ff01eeb03d934de5e7665013463"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7"`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "pet_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "veterinarian_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "forum_post" ADD CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323" FOREIGN KEY ("topic_id") REFERENCES "forum_topic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e" FOREIGN KEY ("pet_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pet" ADD CONSTRAINT "FK_68847e00bd32e8e3ec835e397c8" FOREIGN KEY ("breed_id") REFERENCES "breed"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ADD CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ADD CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593" FOREIGN KEY ("medical_order_id") REFERENCES "medical_order"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_aa2a027f6713844ca536c106992" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_c582cc2099f632c095bc904fab4" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_ff01eeb03d934de5e7665013463" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_ff01eeb03d934de5e7665013463"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_c582cc2099f632c095bc904fab4"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_aa2a027f6713844ca536c106992"`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" DROP CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593"`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" DROP CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42"`);
        await queryRunner.query(`ALTER TABLE "pet" DROP CONSTRAINT "FK_68847e00bd32e8e3ec835e397c8"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e"`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323"`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "veterinarian_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "pet_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_ff01eeb03d934de5e7665013463" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ALTER COLUMN "veterinarian_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" ALTER COLUMN "clinic_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" ALTER COLUMN "pet_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_c582cc2099f632c095bc904fab4" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_aa2a027f6713844ca536c106992" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ALTER COLUMN "medical_order_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ADD CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593" FOREIGN KEY ("medical_order_id") REFERENCES "medical_order"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ALTER COLUMN "medicine_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ADD CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pet" ALTER COLUMN "breed_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet" ADD CONSTRAINT "FK_68847e00bd32e8e3ec835e397c8" FOREIGN KEY ("breed_id") REFERENCES "breed"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ALTER COLUMN "pet_owner_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e" FOREIGN KEY ("pet_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_post" ALTER COLUMN "topic_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "forum_post" ADD CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323" FOREIGN KEY ("topic_id") REFERENCES "forum_topic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
