import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVeterinarianUserTable1772589306631 implements MigrationInterface {
    name = 'UpdateVeterinarianUserTable1772589306631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_38736e2377e763e5400653439a1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_38736e2377e763e5400653439a1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
