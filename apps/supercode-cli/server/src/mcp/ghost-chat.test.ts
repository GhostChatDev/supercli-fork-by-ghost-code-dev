import { describe, expect, test } from "bun:test"
import { createGhostChatSetup, redactGhostChatServer } from "./ghost-chat"

describe("Ghost Chat MCP setup", () => {
  test("creates a named HTTP connection with a user-supplied bearer token", () => {
    const setup = createGhostChatSetup("https://chat.example.com/mcp", "test-secret-not-real")
    expect(setup.name).toBe("ghost-chat")
    expect(setup.server).toEqual({
      type: "http",
      url: "https://chat.example.com/mcp",
      headers: { Authorization: "Bearer test-secret-not-real" },
    })
    expect(setup.credentials).toEqual({ accessToken: "test-secret-not-real" })
  })

  test("never places credentials in the URL", () => {
    expect(() => createGhostChatSetup("https://user:password@example.com/mcp", "test-secret-not-real"))
      .toThrow("not in the MCP URL")
    expect(() => createGhostChatSetup("https://example.com/mcp?token=test-secret-not-real", "test-secret-not-real"))
      .toThrow("not in the MCP URL")
  })

  test("rejects missing token and unsupported URLs", () => {
    expect(() => createGhostChatSetup("https://example.com/mcp", "")).toThrow("GHOST_CHAT_MCP_TOKEN")
    expect(() => createGhostChatSetup("file:///tmp/mcp", "test-secret-not-real")).toThrow("http://")
    expect(() => createGhostChatSetup("not a URL", "test-secret-not-real")).toThrow("https://")
  })

  test("redacts authorization before displaying configuration", () => {
    const setup = createGhostChatSetup("https://example.com/mcp", "test-secret-not-real")
    const display = JSON.stringify(redactGhostChatServer(setup.server))
    expect(display).toContain("Bearer [redacted]")
    expect(display).not.toContain("test-secret-not-real")
    expect(setup.server.headers?.Authorization).toBe("Bearer test-secret-not-real")
  })
})
