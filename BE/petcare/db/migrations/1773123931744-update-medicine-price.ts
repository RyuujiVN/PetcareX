import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMedicinePrice1773123931744 implements MigrationInterface {
    name = 'UpdateMedicinePrice1773123931744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medicine" ADD "price" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "medicine" DROP COLUMN "price"`);
    }

}
