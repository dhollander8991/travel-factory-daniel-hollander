import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserRole } from '@org/shared';
import { AppError } from '../middleware/errorHandler';

const getUserRepo = () => AppDataSource.getRepository(User);

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Registers a new user in the system
 * @param params.name - The user's full name
 * @param params.email - The user's email address (must be unique)
 * @param params.password - Plain text password (will be hashed before storing)
 * @param params.role - Whether the user is a Requester or Validator
 * @returns The created user without the password field
 */
export const register = async ({ name, email, password, role }: RegisterParams) => {
  const repo = getUserRepo();

  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email already in use', 'EMAIL_EXISTS', 'email');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = repo.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  const saved = await repo.save(user);

  const { password: _, ...userWithoutPassword } = saved;
  return userWithoutPassword;
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

interface LoginParams {
  email: string;
  password: string;
  requiredRole: UserRole;
}

export const login = async ({ email, password, requiredRole }: LoginParams) => {
  const repo = getUserRepo();

  const user = await repo
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.email = :email', { email })
    .getOne();

  if (!user) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.role !== requiredRole) {
    throw new AppError(403, 'Access denied for this portal', 'WRONG_PORTAL');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};