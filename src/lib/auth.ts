import { cookies } from "next/headers";
import * as jose from "jose";
import { redirect } from "next/navigation";

export type User = {
  company_id: string;
  email: string;
  user_name: string;
  user_id: string;
  security_level: string;
};

const envPrefix = process.env.LEVEL === "prod" ? "" : "staging-";
const JWKS = jose.createRemoteJWKSet(
  new URL(`https://${envPrefix}equipmentshare.auth0.com/.well-known/jwks.json`)
);
const extractTokenValue = (keySuffix: string, token: {}) => {
  return Object.entries(token)
    .filter(([key]) => key.endsWith(keySuffix))
    .map(([, value]) => value)
    .find(() => true) as string;
};

export const getAuthUser = async () => {
  const token = (await cookies()).get("jwt")?.value || "";
  const { payload } = await jose.jwtVerify(token, JWKS);
  const user: User = {
    company_id: extractTokenValue("equipmentshare.com/es_company_id", payload),
    email: extractTokenValue("equipmentshare.com/es_user_email", payload),
    user_name: extractTokenValue("equipmentshare.com/es_user_name", payload),
    user_id: extractTokenValue("equipmentshare.com/es_user_id", payload),
    security_level: extractTokenValue(
      "equipmentshare.com/es_security_level_id",
      payload
    ),
  };

  return { isAuth: true, user };
};

export const useAuth = async () => {
  const payload = await getAuthUser().catch((err) => {
    console.log(err);
    redirect("/auth");
  });

  return payload;
};
