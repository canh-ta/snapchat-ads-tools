import { JWT } from 'next-auth/jwt';

export const getHeaders = ({ access_token }: JWT) => {
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${access_token}`);
  headers.append('Content-Type', 'application/json');

  return headers;
};
