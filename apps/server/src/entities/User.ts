import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '@org/shared';
import { VacationRequest } from './VacationRequest';

@Entity('users')
export class User {

  // 'uuid' tells PostgreSQL to generate a UUID v4 automatically
  // UUID format: a3f8c2d1-4b5e-4c6f-8d7e-9f0a1b2c3d4e
  // Never sequential — reveals nothing about the data
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false, select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.REQUESTER,
    nullable: false,
  })
  role: UserRole;

  @OneToMany(() => VacationRequest, (req) => req.user)
  requests: VacationRequest[];

  @CreateDateColumn()
  createdAt: Date;
}