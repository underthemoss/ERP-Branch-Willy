import Sqids from "sqids";
import crypto, { hash } from "crypto";

import { v5 as uuid } from "uuid";

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

// ensuring a deterministic mongo ID for an auto-incrementing id in external table
export const sourceSystemIdHash = (source: string, id: string) => {
  return encodeString(`${source}-${id}`);
};

export const deterministicId = (...args: (string | number)[]) => {
  return crypto
    .createHash("sha256")
    .update(String(args.join("")))
    .digest("hex");
};

export const tenantIds = (companyId: string | number) => {
  const cid = companyId.toString();
  return {
    t3WorkspaceId: deterministicId("t3-workspace", cid),
    t3WorkspaceNameColumnId: deterministicId("t3-workspace-name-column", cid),
    userSheetId: deterministicId("t3-users-sheet", cid),
    userId: (userId: number) =>
      deterministicId("public.assets", userId.toString(), cid),
    userSheetNameColumn: (identitier: string) =>
      deterministicId("t3-users-sheet-name-column", identitier, cid),
    branchesSheetId: deterministicId("t3-branches-sheet", cid),
    branchesSheeNameColumntId: deterministicId(
      "t3-branches-sheet-name-column",
      cid
    ),
    assetsSheetId: deterministicId("t3-assets-sheet", cid),
    assetsSheetColumn: (identifier: string) =>
      deterministicId("t3-assets-sheet-column", identifier, cid),
    assetId: (assetId: number) =>
      deterministicId("public.assets", assetId.toString(), cid),
  };
};
