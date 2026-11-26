import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './db';
import { User } from './models/User';

dotenv.config();

function requiredEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

async function createUserIfMissing(
  email: string,
  password: string,
  name: string,
  role: 'ADMIN' | 'COLLECTOR'
) {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.role !== role) {
      throw new Error(
        `Bootstrap email ${normalizedEmail} already belongs to a ${existingUser.role}; refusing to change its role.`
      );
    }
    console.log(`${role} already exists for ${normalizedEmail}; leaving it unchanged.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
  });
  console.log(`Created ${role} account for ${normalizedEmail}.`);
}

async function seed() {
  await connectDB();

  const adminEmail = requiredEnv('BOOTSTRAP_ADMIN_EMAIL');
  const adminPassword = requiredEnv('BOOTSTRAP_ADMIN_PASSWORD');
  const collectorEmail = requiredEnv('BOOTSTRAP_COLLECTOR_EMAIL');
  const collectorPassword = requiredEnv('BOOTSTRAP_COLLECTOR_PASSWORD');

  if ((adminEmail && !adminPassword) || (!adminEmail && adminPassword)) {
    throw new Error('Set both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD together.');
  }
  if ((collectorEmail && !collectorPassword) || (!collectorEmail && collectorPassword)) {
    throw new Error('Set both BOOTSTRAP_COLLECTOR_EMAIL and BOOTSTRAP_COLLECTOR_PASSWORD together.');
  }

  if (!adminEmail && !collectorEmail) {
    console.log(
      'No bootstrap credentials supplied. Set BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD ' +
      'or BOOTSTRAP_COLLECTOR_EMAIL/BOOTSTRAP_COLLECTOR_PASSWORD to create accounts.'
    );
    return;
  }

  if (adminEmail && adminPassword) {
    await createUserIfMissing(
      adminEmail,
      adminPassword,
      process.env.BOOTSTRAP_ADMIN_NAME || 'Waste2Wallet Administrator',
      'ADMIN'
    );
  }

  if (collectorEmail && collectorPassword) {
    await createUserIfMissing(
      collectorEmail,
      collectorPassword,
      process.env.BOOTSTRAP_COLLECTOR_NAME || 'Waste Collector',
      'COLLECTOR'
    );
  }
}

seed()
  .catch((error) => {
    console.error('Bootstrap failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
