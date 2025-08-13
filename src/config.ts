// src/config.ts
import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const CONFIG = {
  DISCORD_TOKEN: requireEnv('DISCORD_TOKEN'),
  DISCORD_CLIENT_ID: requireEnv('DISCORD_CLIENT_ID'),
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || null,
  WEBHOOK_NOTIFICATIONS_CHANNEL_ID: requireEnv('WEBHOOK_NOTIFICATIONS_CHANNEL_ID'),
  DISCORD_ALLOWED_ROLES: (process.env.DISCORD_ALLOWED_ROLES ?? '')
    .split(',')
    .map(role => role.trim())
    .filter(Boolean),
  TEAMCITY_BASE_URL: requireEnv('TEAMCITY_BASE_URL'),
  TEAMCITY_TOKEN: requireEnv('TEAMCITY_TOKEN'),

  WEBHOOK_PORT: Number(requireEnv('WEBHOOK_PORT')),
  WEBHOOK_ROUTE: requireEnv('WEBHOOK_ROUTE')
};
