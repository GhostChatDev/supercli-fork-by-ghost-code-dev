import type { McpServerConfig } from "src/lib/cli-config"

export const GHOST_CHAT_SERVER_NAME = "ghost-chat"
export const DEFAULT_GHOST_CHAT_TOKEN_ENV = "GHOST_CHAT_MCP_TOKEN"

export interface GhostChatSetup {
  name: string
  server: McpServerConfig
  credentials: { accessToken: string; refreshToken?: string }
}

/**
 * Build the per-user Ghost Chat MCP configuration.
 * Callers must not print the returned credentials or server headers.
 */
export function createGhostChatSetup(
  rawUrl: string,
  accessToken: string,
): GhostChatSetup {
  const url = parseGhostChatUrl(rawUrl)
  const token = accessToken.trim()
  if (!token) {
    throw new Error("Set GHOST_CHAT_MCP_TOKEN to your Ghost Chat MCP access token")
  }

  return {
    name: GHOST_CHAT_SERVER_NAME,
    server: {
      type: "http",
      url: url.toString(),
      headers: { Authorization: `Bearer ${token}` },
    },
    credentials: { accessToken: token },
  }
}

export function parseGhostChatUrl(rawUrl: string): URL {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new Error("Enter the full Ghost Chat MCP URL, including https://")
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Ghost Chat MCP URL must use http:// or https://")
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Put the access token in GHOST_CHAT_MCP_TOKEN, not in the MCP URL")
  }
  return url
}

export function redactGhostChatServer(server: McpServerConfig): McpServerConfig {
  if (!server.headers) return { ...server }
  return {
    ...server,
    headers: Object.fromEntries(
      Object.entries(server.headers).map(([name, value]) => [
        name,
        name.toLowerCase() === "authorization" ? "Bearer [redacted]" : value,
      ]),
    ),
  }
}
