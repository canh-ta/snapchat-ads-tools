import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });
  if (!token) {
    return res.status(403);
  }

  const headers = getHeaders(token);
  const requestOptions = { method: 'GET', headers };

  try {
    const response = await fetch(`https://adsapi.snapchat.com/v1/me/organizations`, requestOptions);
    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json(error);
  }
}