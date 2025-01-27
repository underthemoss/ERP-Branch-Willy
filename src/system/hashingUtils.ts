import Sqids from "sqids";
import crypto from "crypto";
const sqids = new Sqids();
// Hash the string into a number
function stringToNumberHash(input: string) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");

  // (13 hex chars = ~52 bits) to fit into Number.MAX_SAFE_INTEGER
  return parseInt(hash.slice(0, 13), 16);
}

// Encode string
function encodeString(input: string) {
  const numberHash = stringToNumberHash(input);
  return sqids.encode([numberHash]);
}

// Deterministic ID for a system entity per tenant
export const tenantScopedSystemEntityId = (
  tenantId: string,
  systemId: string
) => {
  return encodeString(`${tenantId}-${systemId}`);
};

export const sourceSystemIdHash = (source: string, id: string) => {
  return encodeString(`${source}-${id}`);
};
