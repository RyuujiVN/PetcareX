import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPetBreedSpeciesTable1772598277197 implements MigrationInterface {
    name = 'AddPetBreedSpeciesTable1772598277197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`CREATE TABLE "species" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "UQ_1adf701cac3b2c0f8bacb54774b" UNIQUE ("name"), CONSTRAINT "PK_ae6a87f2423ba6c25dc43c32770" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "breed" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "species_id" uuid NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_114e1e2099cad7d73a7f0119604" UNIQUE ("name"), CONSTRAINT "PK_d1c857f060076296ce8a87b9043" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "breed_id" uuid NOT NULL, "gender" boolean NOT NULL, "date_of_birth" date NOT NULL, "weight" numeric(3,1) NOT NULL, "note" text NOT NULL, CONSTRAINT "PK_b1ac2e88e89b9480e0c5b53fa60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "breed" ADD CONSTRAINT "FK_9be70cb24a31c6e1f38ee11c299" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pet" ADD CONSTRAINT "FK_5116a00f46dd9097ed6bd8dd6a5" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pet" ADD CONSTRAINT "FK_68847e00bd32e8e3ec835e397c8" FOREIGN KEY ("breed_id") REFERENCES "breed"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_38736e2377e763e5400653439a1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "veterinarian" DROP CONSTRAINT "FK_38736e2377e763e5400653439a1"`);
        await queryRunner.query(`ALTER TABLE "pet" DROP CONSTRAINT "FK_68847e00bd32e8e3ec835e397c8"`);
        await queryRunner.query(`ALTER TABLE "pet" DROP CONSTRAINT "FK_5116a00f46dd9097ed6bd8dd6a5"`);
        await queryRunner.query(`ALTER TABLE "breed" DROP CONSTRAINT "FK_9be70cb24a31c6e1f38ee11c299"`);
        await queryRunner.query(`DROP TABLE "pet"`);
        await queryRunner.query(`DROP TABLE "breed"`);
        await queryRunner.query(`DROP TABLE "species"`);
        await queryRunner.query(`ALTER TABLE "veterinarian" ADD CONSTRAINT "FK_38736e2377e763e5400653439a1" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
