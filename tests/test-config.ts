import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (local overrides), then fallback to .env
// dotenv.config does not overwrite existing keys, so order matters.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const TEST_CONFIG = {
  ADMIN_EMAIL: process.env.TEST_ADMIN_EMAIL || 'admin@edificio.local',
  ADMIN_PASSWORD: process.env.TEST_ADMIN_PASSWORD || 'dummy_admin_pwd',
  RESIDENT_EMAIL: process.env.TEST_RESIDENT_EMAIL || 'resident@edificio.local',
  RESIDENT_PASSWORD: process.env.TEST_RESIDENT_PASSWORD || 'dummy_resident_pwd',
};
