import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });
  const { name, id, ad_account_id, status, start_time, end_time, daily_budget_micro, lifetime_spend_cap_micro } =
    req.body;

  if (!token) {
    return res.status(403);
  }

  try {
    const body = JSON.stringify({
      campaigns: [{ id, name, ad_account_id, status, start_time, daily_budget_micro, lifetime_spend_cap_micro }],
    });
    const headers = getHeaders(token);
    const requestOptions = { method: 'PUT', headers, body, redirect: 'follow' };
    const response = await fetch(
      `https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/campaigns`,
      requestOptions as any,
    );
    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json(error);
  }
}
