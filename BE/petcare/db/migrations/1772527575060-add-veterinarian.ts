import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVeterinarian1772527575060 implements MigrationInterface {
    name = 'AddVeterinarian1772527575060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."veterinarian_specialty_enum" AS ENUM('Khám tổng quát', 'Nội khoa', 'Phẫu thuật', 'Siêu âm', 'Tiêm phòng & phòng ngừa')`);
        await queryRunner.query(`CREATE TABLE "veterinarian" ("user_id" character varying NOT NULL, "clinic_id" uuid NOT NULL, "specialty" "public"."veterinarian_specialty_enum" NOT NULL, CONSTRAINT "PK_38736e2377e763e5400653439a1" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'ADMIN_CLINIC', 'VETERINARIAN', 'CUSTOMER')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"text"::"public"."user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_e25acdf8605e1c0987a880e82c0" FOREIGN KEY ("clinic_id") REFERENCES "clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_e25acdf8605e1c0987a880e82c0"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('ADMIN', 'ADMIN_CLINIC', 'DOCTOR', 'CUSTOMER')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`DROP TABLE "veterinarian"`);
        await queryRunner.query(`DROP TYPE "public"."veterinarian_specialty_enum"`);
    }

}
