import { WHITELIST_DOMAIN } from '../constants/list-domain.constant';

const parseConfiguredOrigins = (): string[] => {
  const raw = process.env.CORS_ORIGINS ?? '';
  if (!raw.trim()) return [];

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const isAllowedTunnelOrigin = (origin: string): boolean => {
  return (
    origin.endsWith('.trycloudflare.com') ||
    origin.endsWith('.ngrok-free.app') ||
    origin.endsWith('.ngrok.io')
  );
};

const isAllowedOrigin = (origin: string): boolean => {
  const configuredOrigins = parseConfiguredOrigins();
  return (
    WHITELIST_DOMAIN.includes(origin) ||
    configuredOrigins.includes(origin) ||
    isAllowedTunnelOrigin(origin)
  );
};

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || isAllowedOrigin(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  optionsSuccessStatus: 200,
};
