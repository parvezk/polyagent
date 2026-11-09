import { getAnthropic } from "./anthropic";

export async function createSession(vaultIds: string[]) {
  const client = getAnthropic();
  const agentId = process.env.ANTHROPIC_AGENT_ID!;
  const environmentId = process.env.ANTHROPIC_ENVIRONMENT_ID!;

  const session = await client.beta.sessions.create({
    agent: agentId,
    environment_id: environmentId,
    vault_ids: vaultIds,
  });

  return {
    anthropicSessionId: session.id,
    agentId: session.agent.id,
    environmentId: session.environment_id,
  };
}
