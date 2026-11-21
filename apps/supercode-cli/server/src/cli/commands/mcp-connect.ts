import { Command } from "commander"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { getCliConfig, saveCliConfig, type CliConfig } from "src/lib/cli-config"
import { getMcpManager } from "src/mcp/mcp-manager"
import {
  createGhostChatSetup,
  DEFAULT_GHOST_CHAT_TOKEN_ENV,
  GHOST_CHAT_SERVER_NAME,
} from "src/mcp/ghost-chat"

async function configureGhostChat(url?: string): Promise<void> {
  const prompt = createInterface({ input: stdin, output: stdout })
  let mcpUrl = url
  try {
    mcpUrl ??= await prompt.question("Ghost Chat MCP URL: ")
    // Prefer an environment variable so the token is not echoed or stored in shell history.
    const token = process.env[DEFAULT_GHOST_CHAT_TOKEN_ENV]
    const setup = createGhostChatSetup(mcpUrl, token ?? "")
    const config: Partial<CliConfig> = (await getCliConfig()) ?? {}
    await saveCliConfig({
      ...config,
      mcpServers: { ...config.mcpServers, [setup.name]: setup.server },
      mcpCredentials: { ...config.mcpCredentials, [setup.name]: setup.credentials },
    })
    console.log(`Saved ${GHOST_CHAT_SERVER_NAME}. The access token was not printed.`)
    const connect = await prompt.question("Connect now? (y/N) ")
    if (/^y(es)?$/i.test(connect.trim())) {
      await getMcpManager().reconnectServer(setup.name, setup.server)
      console.log(`Connected to ${GHOST_CHAT_SERVER_NAME}.`)
    }
  } finally {
    prompt.close()
  }
}

export const mcpConnect = new Command("mcp-connect")
  .description("Configure a per-user Ghost Chat MCP connection")
  .argument("[url]", "Ghost Chat MCP address; token is read from GHOST_CHAT_MCP_TOKEN")
  .action(configureGhostChat)
