import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
import { User } from '../entities/User'
import { VacationRequest } from '../entities/VacationRequest'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'vacation_manager',
  username: process.env.DB_USER || 'danielhollander',
  password: process.env.DB_PASS || '',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',

  // Import entity classes directly instead of using a glob path
  // Glob paths can break depending on whether running source or compiled output
  // Direct imports are type-safe and always resolve correctly
  entities: [User, VacationRequest],

  migrations: [`${__dirname}/../migrations/*.{ts,js}`],
})