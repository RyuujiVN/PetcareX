import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppointmentTable1772685945258 implements MigrationInterface {
    name = 'AddAppointmentTable1772685945258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointment_service_enum" AS ENUM('KHAM_SUC_KHOE_DINH_KY', 'KHAM_BENH', 'TIEM_CHUNG', 'TAY_GIUN', 'SIÊU_AM_XET_NGHIEM', 'PHAU_THUAT', 'CAP_CUU', 'KHAM_TAI_NHA')`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_status_enum" AS ENUM('Hẹn thành công', 'Đang khám', 'Đã khám xong', 'Đã huỷ')`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid NOT NULL, "veterinarian_id" uuid NOT NULL, "clinic_id" uuid NOT NULL, "appointment_date" date NOT NULL, "appointment_time" TIME NOT NULL, "service" "public"."appointment_service_enum" NOT NULL, "note" text NOT NULL, "status" "public"."appointment_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_ff01eeb03d934de5e7665013463" FOREIGN KEY ("pet_id") REFERENCES "pet"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_3c6b7a09cbc0d0aca9d8febdf38" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7" FOREIGN KEY ("veterinarian_id") REFERENCES "veterinarian"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_0ecfc3a2324b93c3e4b59035dd7"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_3c6b7a09cbc0d0aca9d8febdf38"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_ff01eeb03d934de5e7665013463"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_service_enum"`);
    }

}
