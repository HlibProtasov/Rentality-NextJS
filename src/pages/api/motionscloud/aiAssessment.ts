
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from 'crypto';
import { env } from "process";

const SECRET_KEY = process.env.API_MOTIONSCLOUD_SECRET;

export function generateXAuthorization() {
    if(!SECRET_KEY) {
        console.error("ai assessment errror: secret key was not set");
        return
    }

  return crypto.createHmac('sha256', SECRET_KEY).digest('hex');
}
function verifyXAuthorization(token: string) {
    const expectedToken = generateXAuthorization();
    return token === expectedToken;
  }
  


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers['x-authorization']  as string | undefined;
  if(verifyXAuthorization(token)) 

}
