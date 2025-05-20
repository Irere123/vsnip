export const _prod_ = process.env.NODE_ENV === 'production';
export const apiBaseUrl = _prod_
  ? 'https://vsnip.onrender.com'
  : 'http://localhost:4000';
export const accessTokenKey = `@vsnip/token${_prod_ ? '' : 'dev'}`;
export const refreshTokenKey = `@vsnip/refresh-token${_prod_ ? '' : 'dev'}`;
