import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvoice1773656365329 implements MigrationInterface {
    name = 'AddInvoice1773656365329'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e" FOREIGN KEY ("pet_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_fbe336cf369c8e9685177f4de5e"`);
    }

}
