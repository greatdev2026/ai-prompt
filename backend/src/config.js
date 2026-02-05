const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ai_prompt_demo',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET || 'dev_refresh_secret'),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  PORT: process.env.PORT || 4000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
}