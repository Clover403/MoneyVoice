require('dotenv').config();

// Parse DATABASE_URL untuk Supabase atau database cloud lainnya
const parseConnectionString = (url) => {
  if (!url) return null;
  
  try {
    // Use URL API for better parsing with special characters
    const dbUrl = new URL(url);
    
    return {
      username: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 5432,
      database: dbUrl.pathname.replace('/', '')
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
};

const dbUrl = process.env.DATABASE_URL;
const parsedUrl = parseConnectionString(dbUrl);

module.exports = {
  development: {
    username: parsedUrl?.username || process.env.DB_USER || 'postgres',
    password: parsedUrl?.password || process.env.DB_PASSWORD || 'postgres',
    database: parsedUrl?.database || process.env.DB_NAME || 'scan_tunai_db',
    host: parsedUrl?.host || process.env.DB_HOST || 'localhost',
    port: parsedUrl?.port || process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    dialectOptions: parsedUrl ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME_TEST || 'scan_tunai_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: parsedUrl?.username || process.env.DB_USER,
    password: parsedUrl?.password || process.env.DB_PASSWORD,
    database: parsedUrl?.database || process.env.DB_NAME,
    host: parsedUrl?.host || process.env.DB_HOST,
    port: parsedUrl?.port || process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};
