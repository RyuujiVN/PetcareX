import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Species } from './species.entity';
import { Pet } from './pet.entity';

@Entity('breed')
export class Breed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'species_id' })
  speciesId: string;

  @Column({ unique: true })
  name: string;

  @ManyToOne(() => Species, (species) => species.breeds, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'species_id' })
  species: Species;

  @OneToMany(() => Pet, (pet) => pet.breed)
  pets: Pet[];
}
