import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTable1773908005199 implements MigrationInterface {
    name = 'CreateTable1773908005199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."veterinarian_specialty_enum" AS ENUM('GENERAL_EXAMINATION', 'INTERNAL_MEDICINE', 'SURGERY', 'ULTRASOUND', 'VACCINATION_AND_PREVENTION')`);
        await queryRunner.query(`CREATE TABLE "veterinarian" ("user_id" uuid NOT NULL, "clinic_id" uuid NOT NULL, "specialty" "public"."veterinarian_specialty_enum" NOT NULL, CONSTRAINT "PK_38736e2377e763e5400653439a1" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."medicine_unit_enum" AS ENUM('PILL', 'BLISTER', 'CAPSULE', 'SACHET', 'BOTTLE', 'VIAL', 'AMPOULE', 'ML', 'MG')`);
        await queryRunner.query(`CREATE TABLE "medicine" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "unit" "public"."medicine_unit_enum" NOT NULL, "quantity" integer NOT NULL, "note" text, "price" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b9e0e6f37b7cadb5f402390928b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_record_medicine" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medical_record_id" uuid NOT NULL, "medicine_id" uuid, "note" text, "quantity" integer NOT NULL DEFAULT '0', "price_at_time" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8278ae363db7158b0e0c61faa4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_vn" character varying NOT NULL, "name_eng" character varying NOT NULL, "price" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c62eae711f1746ddeb1e1553420" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_record_order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medical_record_id" uuid NOT NULL, "medical_order_id" uuid, "note" text, "price_at_time" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e4d8d2680ca2072f3c662ed29b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."invoice_status_enum" AS ENUM('PAID', 'UNPAID')`);
        await queryRunner.query(`CREATE TABLE "invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_owner_id" uuid, "medical_record_id" uuid NOT NULL, "total_amount" integer NOT NULL, "note" text, "status" "public"."invoice_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_ba84bf442572aa3e8e46cf10e7" UNIQUE ("medical_record_id"), CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid, "clinic_id" uuid, "veterinarian_id" uuid, "pet_name" character varying NOT NULL, "name" character varying NOT NULL, "temperature" numeric(3,1) NOT NULL, "heart_rate" integer NOT NULL, "systolic" integer NOT NULL, "diastolic" integer NOT NULL, "weight" numeric(3,1) NOT NULL, "diagnosis" character varying NOT NULL, "symptoms" character varying NOT NULL, "conclusion" character varying, "note" text, "follow_up_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d96ede886356ac47ddcbb0bf3a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pet_species_enum" AS ENUM('DOG', 'CAT', 'BIRD', 'RABBIT')`);
        await queryRunner.query(`CREATE TYPE "public"."pet_breed_enum" AS ENUM('DOG_GOLDEN_RETRIEVER', 'DOG_POODLE', 'DOG_POMERANIAN', 'DOG_CORGI', 'DOG_HUSKY', 'DOG_LABRADOR', 'DOG_SHIBA_INU', 'CAT_BRITISH_SHORTHAIR', 'CAT_BRITISH_LONGHAIR', 'CAT_PERSIAN', 'CAT_SIAMESE', 'CAT_BENGAL', 'BIRD_RED_WHISKERED_BULBUL', 'BIRD_PARROT', 'BIRD_BUDGERIGAR', 'RABBIT_DUTCH', 'RABBIT_LIONHEAD')`);
        await queryRunner.query(`CREATE TABLE "pet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "species" "public"."pet_species_enum", "breed" "public"."pet_breed_enum", "gender" boolean, "date_of_birth" date, "weight" numeric(3,1), "avatar" character varying, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b1ac2e88e89b9480e0c5b53fa60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_service_enum" AS ENUM('PERIODIC_HEALTH_CHECK', 'MEDICAL_EXAMINATION', 'VACCINATION', 'DEWORMING', 'ULTRASOUND_AND_TEST', 'SURGERY', 'EMERGENCY')`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum" AS ENUM('BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid, "veterinarian_id" uuid, "clinic_id" uuid NOT NULL, "appointment_date" date NOT NULL, "appointment_time" TIME NOT NULL, "service" "public"."appointment_service_enum" NOT NULL, "note" text NOT NULL, "status" "public"."appointment_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clinic" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "address" character varying NOT NULL, "avatar_url" character varying, "description" text, "deleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_050033b437380ba808c041fe730" UNIQUE ("email"), CONSTRAINT "UQ_b3df084998059e1f2f31bfd1e84" UNIQUE ("phone"), CONSTRAINT "PK_8e97c18debc9c7f7606e311d763" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_clinic" ("user_id" uuid NOT NULL, "clinic_id" uuid NOT NULL, CONSTRAINT "REL_bdac2a2eb942fbc814c1c13392" UNIQUE ("clinic_id"), CONSTRAINT "PK_4ec59939d454245093eecbcf2d3" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TABLE "forum_topic" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_vn" character varying NOT NULL, "name_eng" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f809313c408194ef92632e89ee8" UNIQUE ("name_vn"), CONSTRAINT "UQ_9461d0533b5ce3a49b57ecfb0a5" UNIQUE ("name_eng"), CONSTRAINT "PK_b5bd8bbfc742fe036e175fff5a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eff3e46d24d416b52a7e0ae4159" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "forum_post" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "author_id" uuid NOT NULL, "topic_id" uuid, "content" text NOT NULL, "comment_count" integer NOT NULL DEFAULT '0', "like_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_35363fad61a4ba1fb0ba562b444" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "forum_comment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "parent_id" uuid, "content" text NOT NULL, "replyCount" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_546f92f6bc18ac7e38b22a7ee3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chatbot_room" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1af70ad48a4fbb7c9d17cfa6b39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'ADMIN_CLINIC', 'VETERINARIAN', 'CUSTOMER')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "address" character varying NOT NULL DEFAULT '', "role" "public"."user_role_enum" NOT NULL, "password" character varying NOT NULL, "avatar_url" character varying, "deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "otp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "email" character varying NOT NULL, "expired_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_38736e2377e763e5400653439a1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_e25acdf8605e1c0987a880e82c0" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ADD CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42" FOREIGN KEY ("medicine_id") REFERENCES "medicine"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" ADD CONSTRAINT "FK_83fe2d52334635b2305b6d4daf9" FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ADD CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593" FOREIGN KEY ("medical_order_id") REFERENCES "medical_order"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" ADD CONSTRAINT "FK_4f0a7f032b7cee6d07d81ad2332" FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e" FOREIGN KEY ("pet_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_ba84bf442572aa3e8e46cf10e7a" FOREIGN KEY ("medical_record_id") REFERENCES "medical_record"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_aa2a027f6713844ca536c106992" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_record" ADD CONSTRAINT "FK_c582cc2099f632c095bc904fab4" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pet" ADD CONSTRAINT "FK_5116a00f46dd9097ed6bd8dd6a5" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_ff01eeb03d934de5e7665013463" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_3c6b7a09cbc0d0aca9d8febdf38" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD CONSTRAINT "FK_4ec59939d454245093eecbcf2d3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" ADD CONSTRAINT "FK_bdac2a2eb942fbc814c1c133929" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_4356ac2f9519c7404a2869f1691" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_d41caa70371e578e2a4791a88ae" FOREIGN KEY ("post_id") REFERENCES "forum_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_post" ADD CONSTRAINT "FK_4d906b6a0b54dda8e300f6b18ab" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_post" ADD CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323" FOREIGN KEY ("topic_id") REFERENCES "forum_topic"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_8f664eeb0b4b3f9c15cdb49b94f" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_ec4e454a29e0f14c7cffb9d1b11" FOREIGN KEY ("post_id") REFERENCES "forum_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comment" ADD CONSTRAINT "FK_f91bfb678b32b237c07381515a6" FOREIGN KEY ("parent_id") REFERENCES "forum_comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chatbot_room" ADD CONSTRAINT "FK_d9e768a6ee0814de60259975f1f" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot_room" DROP CONSTRAINT "FK_d9e768a6ee0814de60259975f1f"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_f91bfb678b32b237c07381515a6"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_ec4e454a29e0f14c7cffb9d1b11"`);
        await queryRunner.query(`ALTER TABLE "forum_comment" DROP CONSTRAINT "FK_8f664eeb0b4b3f9c15cdb49b94f"`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP CONSTRAINT "FK_1b2e0a3b1e4a6a4c46146aa2323"`);
        await queryRunner.query(`ALTER TABLE "forum_post" DROP CONSTRAINT "FK_4d906b6a0b54dda8e300f6b18ab"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_d41caa70371e578e2a4791a88ae"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_4356ac2f9519c7404a2869f1691"`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP CONSTRAINT "FK_bdac2a2eb942fbc814c1c133929"`);
        await queryRunner.query(`ALTER TABLE "admin_clinic" DROP CONSTRAINT "FK_4ec59939d454245093eecbcf2d3"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_3c6b7a09cbc0d0aca9d8febdf38"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_ff01eeb03d934de5e7665013463"`);
        await queryRunner.query(`ALTER TABLE "pet" DROP CONSTRAINT "FK_5116a00f46dd9097ed6bd8dd6a5"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_c582cc2099f632c095bc904fab4"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_6bf5d3edb8de080a0683aa058c9"`);
        await queryRunner.query(`ALTER TABLE "medical_record" DROP CONSTRAINT "FK_aa2a027f6713844ca536c106992"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_ba84bf442572aa3e8e46cf10e7a"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e"`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" DROP CONSTRAINT "FK_4f0a7f032b7cee6d07d81ad2332"`);
        await queryRunner.query(`ALTER TABLE "medical_record_order" DROP CONSTRAINT "FK_2ac4cf261717ab5fd00b5bbd593"`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" DROP CONSTRAINT "FK_83fe2d52334635b2305b6d4daf9"`);
        await queryRunner.query(`ALTER TABLE "medical_record_medicine" DROP CONSTRAINT "FK_0e4eca4e470c7a4ad43d9eaae42"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_e25acdf8605e1c0987a880e82c0"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`DROP TABLE "otp"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "chatbot_room"`);
        await queryRunner.query(`DROP TABLE "forum_comment"`);
        await queryRunner.query(`DROP TABLE "forum_post"`);
        await queryRunner.query(`DROP TABLE "like"`);
        await queryRunner.query(`DROP TABLE "forum_topic"`);
        await queryRunner.query(`DROP TABLE "admin_clinic"`);
        await queryRunner.query(`DROP TABLE "clinic"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_service_enum"`);
        await queryRunner.query(`DROP TABLE "pet"`);
        await queryRunner.query(`DROP TYPE "public"."pet_breed_enum"`);
        await queryRunner.query(`DROP TYPE "public"."pet_species_enum"`);
        await queryRunner.query(`DROP TABLE "medical_record"`);
        await queryRunner.query(`DROP TABLE "invoice"`);
        await queryRunner.query(`DROP TYPE "public"."invoice_status_enum"`);
        await queryRunner.query(`DROP TABLE "medical_record_order"`);
        await queryRunner.query(`DROP TABLE "medical_order"`);
        await queryRunner.query(`DROP TABLE "medical_record_medicine"`);
        await queryRunner.query(`DROP TABLE "medicine"`);
        await queryRunner.query(`DROP TYPE "public"."medicine_unit_enum"`);
        await queryRunner.query(`DROP TABLE "veterinarian"`);
        await queryRunner.query(`DROP TYPE "public"."veterinarian_specialty_enum"`);
    }

}
