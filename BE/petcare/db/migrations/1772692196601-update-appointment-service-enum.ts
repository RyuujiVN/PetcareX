import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAppointmentServiceEnum1772692196601 implements MigrationInterface {
    name = 'UpdateAppointmentServiceEnum1772692196601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."appointment_service_enum" RENAME TO "appointment_service_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."appointment_service_enum" AS ENUM('Khám sức khoẻ định kỳ', 'Khám bệnh', 'Tiêm chủng', 'Tẩy giun', 'Siêu âm xét nghiệm', 'Phẫu thuật', 'Cấp cứu')`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "service" TYPE "public"."appointment_service_enum" USING "service"::"text"::"public"."appointment_service_enum"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_service_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointment_service_enum_old" AS ENUM('KHAM_SUC_KHOE_DINH_KY', 'KHAM_BENH', 'TIEM_CHUNG', 'TAY_GIUN', 'SIÊU_AM_XET_NGHIEM', 'PHAU_THUAT', 'CAP_CUU', 'KHAM_TAI_NHA')`);
        await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "service" TYPE "public"."appointment_service_enum_old" USING "service"::"text"::"public"."appointment_service_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."appointment_service_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."appointment_service_enum_old" RENAME TO "appointment_service_enum"`);
    }

}
