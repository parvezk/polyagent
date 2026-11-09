import { getAnthropic } from "./anthropic";
import { db } from "./db";
import { user } from "./schema";

export async function getOrCreateVaultForUser(userId: string): Promise<string> {
  const [row] = await db
    .select({ vaultId: user.vaultId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (row?.vaultId) return row.vaultId;

  const client = getAnthropic();
  const vault = await client.beta.vaults.create({
    display_name: `user-${userId}`,
    metadata: { userId },
  });

  await db.update(user).set({ vaultId: vault.id }).where(eq(user.id, userId));
  return vault.id;
}

export async function syncMCPCredential(
  vaultId: string,
  serverName: string,
  serverUrl: string,
  token: string,
): Promise<string> {
  const client = getAnthropic();

  const credential = await client.beta.vaults.credentials.create(vaultId, {
    display_name: `${serverName} Token`,
    auth: {
      type: "static_bearer",
      token,
      mcp_server_url: serverUrl,
    },
  });

  return credential.id;
}
