import 'dotenv/config';

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4100),
  appOrigin: process.env.APP_ORIGIN ?? 'http://localhost:5173',
  allowedOrigins: (process.env.APP_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  supabaseUrl: process.env.SUPABASE_URL as string,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY as string,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string
};
