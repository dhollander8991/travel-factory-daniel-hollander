import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { RequestStatus } from '@org/shared';
import { User } from './User';

@Index(['user', 'startDate', 'endDate'])
@Entity('vacation_requests')
export class VacationRequest {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.requests, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ type: 'date', nullable: false })
  startDate: string;

  @Column({ type: 'date', nullable: false })
  endDate: string;

  @Column({ type: 'text', nullable: true, default: null })
  reason: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: 'text', nullable: true, default: null })
  comments: string | null;

  @CreateDateColumn()
  createdAt: Date;
}