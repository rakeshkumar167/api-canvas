"use client";

import { useState, useMemo } from "react";
import { Send, Loader2, Clock, ChevronDown } from "lucide-react";
import type { HttpMethod, Operation, OpenAPISpec } from "@/types/openapi";
import { generateExample } from "@/lib/openapi-parser";

interface TryItOutProps {
  method: HttpMethod;
  path: string;
  operation: Operation;
  baseUrl: string;
  spec: OpenAPISpec;
}

interface ResponseState {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
}

function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-green-500";
  if (status >= 400 && status < 500) return "text-orange-500";
  if (status >= 500) return "text-red-500";
  return "text-[hsl(var(--foreground))]";
}

function statusBgColor(status: number): string {
  if (status >= 200 && status < 300) return "bg-green-500/10 border-green-500/30";
  if (status >= 400 && status < 500) return "bg-orange-500/10 border-orange-500/30";
  if (status >= 500) return "bg-red-500/10 border-red-500/30";
  return "bg-[hsl(var(--muted))] border-[hsl(var(--border))]";
}

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default function TryItOut({
  method,
  path,
  operation,
  baseUrl,
  spec,
}: TryItOutProps) {
  const pathParamNames = useMemo(() => extractPathParams(path), [path]);
  const queryParams = useMemo(
    () => (operation.parameters ?? []).filter((p) => p.in === "query"),
    [operation.parameters]
  );
  const headerParams = useMemo(
    () => (operation.parameters ?? []).filter((p) => p.in === "header"),
    [operation.parameters]
  );

  const bodySchema = useMemo(() => {
    const content = operation.requestBody?.content;
    if (!content) return null;
    const mediaType =
      content["application/json"] ?? Object.values(content)[0];
    return mediaType?.schema ?? null;
  }, [operation.requestBody]);

  const bodyPlaceholder = useMemo(() => {
    if (!bodySchema) return "";
    try {
      return JSON.stringify(generateExample(spec, bodySchema), null, 2);
    } catch {
      return "{}";
    }
  }, [bodySchema, spec]);

  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [headerValues, setHeaderValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [headersOpen, setHeadersOpen] = useState(false);

  async function handleSend() {
    setLoading(true);
    setResponse(null);
    setError(null);

    let url = path;
    for (const name of pathParamNames) {
      url = url.replace(`{${name}}`, encodeURIComponent(pathValues[name] ?? ""));
    }

    const queryString = Object.entries(queryValues)
      .filter(([, v]) => v.length > 0)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const fullUrl = `${baseUrl}${url}${queryString ? `?${queryString}` : ""}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    for (const [k, v] of Object.entries(headerValues)) {
      if (v.length > 0) headers[k] = v;
    }

    const start = performance.now();

    try {
      const res = await fetch(fullUrl, {
        method: method.toUpperCase(),
        mode: "cors",
        headers,
        body:
          bodySchema && body.trim().length > 0 ? body : undefined,
      });
      const elapsed = Math.round(performance.now() - start);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      let resBody: string;
      try {
        resBody = await res.text();
      } catch {
        resBody = "";
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: resBody,
        time: elapsed,
      });
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      const message =
        err instanceof TypeError
          ? "Network error: the request failed. This may be caused by CORS restrictions, a missing server, or a network issue."
          : err instanceof Error
          ? err.message
          : "An unknown error occurred.";
      setError(message);
      setResponse(
        (prev) => prev ?? { status: 0, statusText: "", headers: {}, body: "", time: elapsed }
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]";
  const labelClass =
    "block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1";

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
          Try It Out
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Path Parameters */}
        {pathParamNames.length > 0 && (
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
              Path Parameters
            </legend>
            <div className="space-y-2">
              {pathParamNames.map((name) => {
                const paramDef = (operation.parameters ?? []).find(
                  (p) => p.in === "path" && p.name === name
                );
                return (
                  <div key={name}>
                    <label className={labelClass}>
                      {name}
                      {paramDef?.required !== false && (
                        <span className="text-red-500 ml-0.5">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder={
                        paramDef?.example != null
                          ? String(paramDef.example)
                          : paramDef?.schema?.example != null
                          ? String(paramDef.schema.example)
                          : name
                      }
                      value={pathValues[name] ?? ""}
                      onChange={(e) =>
                        setPathValues((prev) => ({
                          ...prev,
                          [name]: e.target.value,
                        }))
                      }
                    />
                    {paramDef?.description && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {paramDef.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Query Parameters */}
        {queryParams.length > 0 && (
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
              Query Parameters
            </legend>
            <div className="space-y-2">
              {queryParams.map((param) => (
                <div key={param.name}>
                  <label className={labelClass}>
                    {param.name}
                    {param.required && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder={
                      param.example != null
                        ? String(param.example)
                        : param.schema?.example != null
                        ? String(param.schema.example)
                        : param.name
                    }
                    value={queryValues[param.name] ?? ""}
                    onChange={(e) =>
                      setQueryValues((prev) => ({
                        ...prev,
                        [param.name]: e.target.value,
                      }))
                    }
                  />
                  {param.description && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {/* Header Parameters */}
        {headerParams.length > 0 && (
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
              Headers
            </legend>
            <div className="space-y-2">
              {headerParams.map((param) => (
                <div key={param.name}>
                  <label className={labelClass}>
                    {param.name}
                    {param.required && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder={
                      param.example != null
                        ? String(param.example)
                        : param.name
                    }
                    value={headerValues[param.name] ?? ""}
                    onChange={(e) =>
                      setHeaderValues((prev) => ({
                        ...prev,
                        [param.name]: e.target.value,
                      }))
                    }
                  />
                  {param.description && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {/* Request Body */}
        {bodySchema && (
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
              Request Body
            </legend>
            <textarea
              className={`${inputClass} font-mono text-xs min-h-[120px] resize-y`}
              placeholder={bodyPlaceholder}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
            />
            {operation.requestBody?.description && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                {operation.requestBody.description}
              </p>
            )}
          </fieldset>
        )}

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? "Sending..." : "Send Request"}
        </button>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Response */}
        {response && response.status > 0 && (
          <div className="space-y-3">
            {/* Status + Time */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold ${statusBgColor(response.status)} ${statusColor(response.status)}`}
              >
                {response.status} {response.statusText}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                <Clock className="h-3 w-3" />
                {response.time}ms
              </span>
            </div>

            {/* Response Headers (collapsible) */}
            {Object.keys(response.headers).length > 0 && (
              <div className="rounded-md border border-[hsl(var(--border))]">
                <button
                  type="button"
                  onClick={() => setHeadersOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <span>Response Headers ({Object.keys(response.headers).length})</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${headersOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {headersOpen && (
                  <div className="border-t border-[hsl(var(--border))] px-3 py-2">
                    <dl className="space-y-1 text-xs font-mono">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <dt className="font-semibold text-[hsl(var(--foreground))] shrink-0">
                            {key}:
                          </dt>
                          <dd className="text-[hsl(var(--muted-foreground))] break-all">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}

            {/* Response Body */}
            {response.body && (
              <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <div className="px-3 py-1.5 border-b border-[hsl(var(--border))]">
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Response Body
                  </span>
                </div>
                <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
                  <code className="text-[hsl(var(--foreground))]">
                    {formatJson(response.body)}
                  </code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
