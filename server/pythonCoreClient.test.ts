import { afterEach, describe, expect, it, vi } from "vitest";

describe("Python Core gateway client", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.NEXO_PYTHON_CORE_URL;
    delete process.env.NEXO_PYTHON_CORE_TIMEOUT_MS;
  });

  it("usa NEXO_PYTHON_CORE_URL para checar o health do Core", async () => {
    process.env.NEXO_PYTHON_CORE_URL = "http://python-core.local:8010";

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({ status: "ok", service: "nexo-python-core" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      );
    });
    vi.stubGlobal("fetch", fetchMock as typeof fetch);

    const { getPythonCoreHealth } = await import("./_core/pythonCoreClient");
    const result = await getPythonCoreHealth();

    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://python-core.local:8010/health"
    );
  });

  it("retorna fallback seguro quando o Python Core esta offline", async () => {
    process.env.NEXO_PYTHON_CORE_URL = "http://127.0.0.1:65535";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      }) as typeof fetch
    );

    const { analyzeWithPythonCore, getPythonCoreHealth } = await import(
      "./_core/pythonCoreClient"
    );

    const health = await getPythonCoreHealth();
    const analysis = await analyzeWithPythonCore({
      user_id: "user-test",
      income: 1000,
      expenses: 1200,
      goals: [],
      transactions: [],
      current_context: { source: "test" },
    });

    expect(health.ok).toBe(false);
    expect(analysis.risk_level).toBe("critical");
    expect(analysis.rive_state).toBe("alert");
    expect(analysis.financial_summary.risk_drivers[0]).toContain(
      "fallback local"
    );
  });
});
