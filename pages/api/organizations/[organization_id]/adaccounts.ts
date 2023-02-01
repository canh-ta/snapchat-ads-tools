import { getHeaders } from "@/libs/headers";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { organization_id } = req.query;
  const token = await getToken({ req });

  if (!token) {
    return res.status(403);
  }

  const headers = getHeaders(token);
  var requestOptions = {
    method: "GET",
    headers,
  };

  const response = await fetch(
    `https://adsapi.snapchat.com/v1/organizations/${organization_id}/adaccounts`,
    requestOptions
  );

  const result = await response.json();

  return res.status(200).json(result);
}
