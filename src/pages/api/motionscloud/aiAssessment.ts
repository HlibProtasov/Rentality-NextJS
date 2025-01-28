
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from 'crypto';
import { env } from "process";
import { uploadJSONToIPFS } from "@/utils/pinata";
import getProviderApiUrlFromEnv from "@/utils/api/providerApiUrl";

const SECRET_KEY = process.env.API_MOTIONSCLOUD_SECRET;

function generateXAuthorization() {
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
      if(!token) {
        console.error("API aiAssessment error: x-athorization token is not correct");
        res.status(500).json({ error: "token was not set" });
        return
      }
      const jsonData = req.body;
      const chainIdNumber = env.NEXT_PUBLIC_DEFAULT_CHAIN_ID;
      if (!chainIdNumber) {
          console.error("API aiAssessments error: chainId was not provided");
          res.status(400).json({ error: "chainId was not provided" });
          return;
        }
      
        const providerApiUrl = getProviderApiUrlFromEnv(Number.parseInt(chainIdNumber));
      
        if (!providerApiUrl) {
          console.error(`API aiAssessments error: API URL for chain id ${chainIdNumber} was not set`);
          res.status(500).json({ error: `API aiAssessments error: API URL for chain id ${chainIdNumber} was not set` });
          return;
        }
        /// TODO: add smart contract check of case

          if(!verifyXAuthorization(token)) {
            console.error(`API aiAssessments error: token was not correct`);
            res.status(500).json({ error: "token was not correct" });
            return
          }
          const pinataResponse = await uploadJSONToIPFS(jsonData) 

          if(pinataResponse.success === false) {
            console.error('API aiAssessments error: fail to save data')
            res.status(400).json({error: 'fail to save data'})
          }
          res.status(200).json({res: pinataResponse})
          /// TODO: save to smart contract via manager PK

}
