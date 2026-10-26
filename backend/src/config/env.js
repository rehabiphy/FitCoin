const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const list = value =>
  (value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  dnsServers: list(process.env.DNS_SERVERS),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'fitcoin-api',
    audience: 'fitcoin-app',
  },
  googleClientIds: list(process.env.GOOGLE_CLIENT_IDS),
  corsOrigins: list(process.env.CORS_ORIGINS),
  bcryptRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  // Lets "Upgrade" activate premium without a payment (testing). On by default outside production;
  // turn it off once real in-app purchases are connected in premium.service.js.
  premiumTestPurchases: process.env.PREMIUM_TEST_PURCHASES
    ? process.env.PREMIUM_TEST_PURCHASES === 'true'
    : process.env.NODE_ENV !== 'production',
};

if (env.isProd && (env.jwt.accessSecret.length < 32 || env.jwt.refreshSecret.length < 32)) {
  console.error('JWT secrets must be at least 32 characters in production.');
  process.exit(1);
}

export default env;
