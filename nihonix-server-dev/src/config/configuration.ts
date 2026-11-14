export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'nihonix_db',
    // NOTE: dangerous in production
    synchronize:
      process.env.DATABASE_SYNCHRONIZE === 'true' ||
      (process.env.NODE_ENV !== 'production' &&
        process.env.DATABASE_SYNCHRONIZE !== 'false'),
    logging: process.env.NODE_ENV === 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@nihonix.com',
    fromName: process.env.FROM_NAME || 'Nihonix',
  },
  ai: {
    //  apiKey: process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || '',
    // provider: process.env.AI_PROVIDER || 'openrouter',
    // model: process.env.AI_MODEL || 'google/gemini-2.5-pro',
    apiKey:
      process.env.GOOGLE_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.AI_API_KEY ||
      '',
    provider: process.env.AI_PROVIDER || 'gemini',
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    //  apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1',
    apiUrl:
      process.env.GOOGLE_API_URL ||
      process.env.AI_API_URL ||
      'https://generativelanguage.googleapis.com/v1beta',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
    siteName: process.env.OPENROUTER_SITE_NAME || 'Nihonix',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'nihonix',
  },
});
