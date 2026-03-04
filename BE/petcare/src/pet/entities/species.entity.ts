import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Breed } from './breed.entity';

@Entity('species')
export class Species {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Breed, (bread) => bread.species)
  breeds: Breed[];
}
