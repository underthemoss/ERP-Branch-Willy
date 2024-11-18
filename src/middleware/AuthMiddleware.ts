import { z } from "zod";
import createHttpError from "http-errors";
import { Middleware } from "express-zod-api";
import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";

const extractTokenValue = (keySuffix: string, token: {}) => {
  return Object.entries(token)
    .filter(([key]) => key.endsWith(keySuffix))
    .map(([, value]) => value)
    .find(() => true) as string;
};

const envPrefix = process.env.LEVEL === "prod" ? "" : "staging-";

export const verifyUser = async (authHeader: string): Promise<any> => {
  const token = authHeader.split("Bearer")?.[1]?.trim();

  const client = jwksClient({
    jwksUri: `https://${envPrefix}equipmentshare.auth0.com/.well-known/jwks.json`,
    cache: true,
  });

  const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
    client.getSigningKey(header.kid, function (err, key: any) {
      if (err) {
        console.error(err);
      }
      var signingKey = key?.publicKey || key?.rsaPublicKey;
      callback(err, signingKey);
    });
  };
  const decodedToken = await new Promise<any>((res, rej) => {
    jwt.verify(token, getKey, undefined, (err: any, decoded: any) => {
      if (err) {
        console.error(err);
        rej(err);
      }
      res(decoded);
    });
  });
  return decodedToken;
};

export const authMiddleware = new Middleware({
  security: {
    // this information is optional and used for generating documentation
    and: [{ type: "header", name: "Authorization" }],
  },
  input: z.object({}),
  handler: async ({ request, logger }) => {
    const bearerToken = request.headers.authorization;
    if (!bearerToken) {
      throw createHttpError(401, "Invalid token");
    }
    try {
      const token = await verifyUser(bearerToken);
      const user = {
        company_id: extractTokenValue(
          "equipmentshare.com/es_company_id",
          token
        ),
        email: extractTokenValue("equipmentshare.com/es_user_email", token),
        user_name: extractTokenValue("equipmentshare.com/es_user_name", token),
        user_id: extractTokenValue("equipmentshare.com/es_user_id", token),
        security_level: extractTokenValue(
          "equipmentshare.com/es_security_level_id",
          token
        ),
      };

      return { bearerToken, user };
    } catch {
      throw createHttpError(401, "Invalid token");
    }
  },
});
