import _ from 'lodash';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getHeaders } from '@libs/headers';
import { CampaignCreateDTO } from '@models/Campaign';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, ad_account_id, status, start_time, objective, daily_budget_micro, end_time, lifetime_spend_cap_micro } =
    req.body as CampaignCreateDTO;

  const token = await getToken({ req });
  if (!token) {
    return res.status(403);
  }
  if (req.method === 'POST') {
    try {
      const headers = getHeaders(token);
      const body = JSON.stringify({
        campaigns: [
          {
            name,
            ad_account_id,
            status,
            start_time,
            objective,
            daily_budget_micro,
            end_time,
            lifetime_spend_cap_micro,
          },
        ],
      });
      const requestOptions = { method: 'POST', headers, body, redirect: 'follow' };
      const response = await fetch(
        `https://adsapi.snapchat.com/v1/adaccounts/${ad_account_id}/campaigns`,
        requestOptions as any,
      );
      const result = await response.json();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json(error);
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
