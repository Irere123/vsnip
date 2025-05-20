declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    POSTGRES_URL: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_SECRET: string;
    GOOGLE_OAUTH_CLIENT_ID: string
    GOOGLE_OAUTH_CLIENT_SECRET: string
    SERVER_URL: string
  }
}
