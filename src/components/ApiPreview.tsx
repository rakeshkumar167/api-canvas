"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  FileJson,
} from "lucide-react";
import type {
  OpenAPISpec,
  ParsedEndpoint,
  Operation,
  Parameter,
  SchemaObject,
  RequestBody,
  Response as OAResponse,
} from "@/types/openapi";
import {
  getEndpoints,
  groupEndpointsByTag,
  generateExample,
  generateCodeSnippet,
} from "@/lib/openapi-parser";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApiPreviewProps {
  spec: OpenAPISpec | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METHOD_CLASSES: Record<string, string> = {
  get: "method-get",
  post: "method-post",
  put: "method-put",
  patch: "method-patch",
  delete: "method-delete",
};

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  get: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  post: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  put: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
  },
  patch: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-500/20",
  },
  delete: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
  },
};

const STATUS_COLORS: Record<string, string> = {
  "2": "text-emerald-600 dark:text-emerald-400",
  "3": "text-blue-600 dark:text-blue-400",
  "4": "text-orange-600 dark:text-orange-400",
  "5": "text-red-600 dark:text-red-400",
};

type CodeLang = "curl" | "javascript" | "python";

const CODE_TABS: { label: string; value: CodeLang }[] = [
  { label: "cURL", value: "curl" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
];

// ---------------------------------------------------------------------------
// Utility: copy to clipboard hook
// ---------------------------------------------------------------------------

function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      });
    },
    [timeout],
  );

  return { copied, copy };
}

// ---------------------------------------------------------------------------
// Sub-component: SchemaView
// ---------------------------------------------------------------------------

function SchemaView({
  spec,
  schema,
  label,
}: {
  spec: OpenAPISpec;
  schema: SchemaObject;
  label?: string;
}) {
  const example = useMemo(() => generateExample(spec, schema), [spec, schema]);
  const json = JSON.stringify(example, null, 2);
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="mt-3">
      {label && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </p>
      )}
      <div className="relative rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
        <button
          type="button"
          onClick={() => copy(json)}
          className="absolute right-2 top-2 rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
          aria-label="Copy"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-[var(--text-primary)] font-mono">
          {json}
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: ParametersTable
// ---------------------------------------------------------------------------

function ParametersTable({ parameters }: { parameters: Parameter[] }) {
  if (parameters.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Parameters
      </p>
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Name
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                In
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Type
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Required
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {parameters.map((param) => (
              <tr key={`${param.in}-${param.name}`} className="transition-colors hover:bg-[var(--bg-secondary)]/50">
                <td className="px-4 py-3 font-mono text-[13px] font-medium text-[var(--text-primary)]">
                  {param.name}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)]">
                    {param.in}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                  {param.schema?.type || "any"}
                  {param.schema?.format ? (
                    <span className="ml-1 text-[var(--text-secondary)]/60">
                      ({param.schema.format})
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {param.required ? (
                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-500/20">
                      required
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]/60">optional</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
                  {param.description || "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: CodeSnippets
// ---------------------------------------------------------------------------

function CodeSnippets({
  method,
  path,
  baseUrl,
  body,
}: {
  method: string;
  path: string;
  baseUrl: string;
  body?: unknown;
}) {
  const [activeTab, setActiveTab] = useState<CodeLang>("curl");
  const { copied, copy } = useCopyToClipboard();

  const snippet = useMemo(
    () => generateCodeSnippet(method, path, baseUrl, body, activeTab),
    [method, path, baseUrl, body, activeTab],
  );

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Code Examples
      </p>
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          {CODE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`
                relative px-4 py-2 text-xs font-medium transition-colors
                ${
                  activeTab === tab.value
                    ? "text-[var(--text-primary)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto pr-2">
            <button
              type="button"
              onClick={() => copy(snippet)}
              className="rounded-md p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
              aria-label="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        {/* Code */}
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-[var(--text-primary)] font-mono bg-[var(--bg-secondary)]">
          {snippet}
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: ResponseSection
// ---------------------------------------------------------------------------

function ResponseSection({
  responses,
  spec,
}: {
  responses: Record<string, OAResponse>;
  spec: OpenAPISpec;
}) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Responses
      </p>
      <div className="space-y-1.5">
        {Object.entries(responses).map(([code, response]) => {
          const colorKey = code.charAt(0);
          const colorClass = STATUS_COLORS[colorKey] || "text-[var(--text-primary)]";
          const isExpanded = expandedCode === code;
          const schema = response.content?.["application/json"]?.schema;

          return (
            <div
              key={code}
              className="overflow-hidden rounded-lg border border-[var(--border)]"
            >
              <button
                type="button"
                onClick={() => setExpandedCode(isExpanded ? null : code)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--bg-secondary)]"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                )}
                <span className={`font-mono text-sm font-bold ${colorClass}`}>
                  {code}
                </span>
                <span className="text-sm text-[var(--text-secondary)]">
                  {response.description || ""}
                </span>
              </button>
              {isExpanded && schema && (
                <div className="border-t border-[var(--border)] px-4 pb-4">
                  <SchemaView spec={spec} schema={schema} label="Response Body" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: EndpointCard
// ---------------------------------------------------------------------------

function EndpointCard({
  endpoint,
  spec,
  baseUrl,
}: {
  endpoint: ParsedEndpoint;
  spec: OpenAPISpec;
  baseUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { method, path, operation } = endpoint;
  const colors = METHOD_COLORS[method] || METHOD_COLORS.get;
  const methodClass = METHOD_CLASSES[method] || "";

  // Compute request body example for code snippets
  const requestBodySchema =
    operation.requestBody?.content?.["application/json"]?.schema;
  const requestBodyExample = useMemo(() => {
    if (!requestBodySchema) return undefined;
    return generateExample(spec, requestBodySchema);
  }, [spec, requestBodySchema]);

  return (
    <div
      className={`
        group overflow-hidden rounded-xl border transition-all duration-200
        ${
          expanded
            ? `border-[var(--border)] shadow-sm`
            : "border-[var(--border)] hover:border-[var(--text-secondary)]/30 hover:shadow-sm"
        }
      `}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)]/50"
      >
        <span className="text-[var(--text-secondary)]">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>

        <span
          className={`
            ${methodClass}
            inline-flex min-w-[68px] items-center justify-center rounded-md px-2.5 py-1
            text-xs font-bold uppercase tracking-wide
            ${colors.bg} ${colors.text} border ${colors.border}
          `}
        >
          {method}
        </span>

        <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
          {path}
        </span>

        {operation.deprecated && (
          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
            deprecated
          </span>
        )}

        <span className="ml-auto text-sm text-[var(--text-secondary)] truncate max-w-[40%]">
          {operation.summary || ""}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-6 py-5 space-y-1">
          {/* Description */}
          {operation.description && (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {operation.description}
            </p>
          )}

          {/* Parameters */}
          {operation.parameters && operation.parameters.length > 0 && (
            <ParametersTable parameters={operation.parameters} />
          )}

          {/* Request Body */}
          {requestBodySchema && (
            <SchemaView
              spec={spec}
              schema={requestBodySchema}
              label="Request Body"
            />
          )}

          {/* Responses */}
          {operation.responses && Object.keys(operation.responses).length > 0 && (
            <ResponseSection responses={operation.responses} spec={spec} />
          )}

          {/* Code Snippets */}
          <CodeSnippets
            method={method}
            path={path}
            baseUrl={baseUrl}
            body={requestBodyExample}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: EndpointGroup
// ---------------------------------------------------------------------------

function EndpointGroup({
  tag,
  tagDescription,
  endpoints,
  spec,
  baseUrl,
  defaultExpanded,
}: {
  tag: string;
  tagDescription?: string;
  endpoints: ParsedEndpoint[];
  spec: OpenAPISpec;
  baseUrl: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? true);

  return (
    <div className="mb-8">
      {/* Tag header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group/tag flex w-full items-center gap-2 pb-3 text-left"
      >
        <span className="text-[var(--text-secondary)] transition-transform">
          {expanded ? (
            <ChevronDown className="h-4.5 w-4.5" />
          ) : (
            <ChevronRight className="h-4.5 w-4.5" />
          )}
        </span>
        <h3 className="text-lg font-semibold capitalize text-[var(--text-primary)] group-hover/tag:text-blue-500 transition-colors">
          {tag}
        </h3>
        <span className="inline-flex items-center rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)]">
          {endpoints.length}
        </span>
      </button>

      {tagDescription && expanded && (
        <p className="mb-4 ml-7 text-sm text-[var(--text-secondary)]">
          {tagDescription}
        </p>
      )}

      {/* Endpoint cards */}
      {expanded && (
        <div className="ml-3 space-y-2.5 border-l-2 border-[var(--border)] pl-5">
          {endpoints.map((ep) => (
            <EndpointCard
              key={`${ep.method}-${ep.path}`}
              endpoint={ep}
              spec={spec}
              baseUrl={baseUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component: ApiPreview
// ---------------------------------------------------------------------------

export default function ApiPreview({ spec, error }: ApiPreviewProps) {
  // ---------- Error state ----------
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
            Invalid Specification
          </h3>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
              {error}
            </p>
          </div>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Fix the error in your OpenAPI specification and try again.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Empty state ----------
  if (!spec) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
            <FileJson className="h-7 w-7 text-[var(--text-secondary)]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
            No API Specification
          </h3>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Start typing or paste an OpenAPI specification in the editor on the
            left to see a live preview of your API documentation here.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Render spec ----------
  return <SpecRenderer spec={spec} />;
}

// ---------------------------------------------------------------------------
// SpecRenderer (extracted to allow hooks at top level)
// ---------------------------------------------------------------------------

function SpecRenderer({ spec }: { spec: OpenAPISpec }) {
  const endpoints = useMemo(() => getEndpoints(spec), [spec]);
  const grouped = useMemo(() => groupEndpointsByTag(endpoints), [endpoints]);

  const baseUrl = spec.servers?.[0]?.url || "https://api.example.com";

  // Build a map of tag name -> description from spec.tags
  const tagDescriptions = useMemo(() => {
    const map: Record<string, string> = {};
    if (spec.tags) {
      for (const t of spec.tags) {
        if (t.description) map[t.name] = t.description;
      }
    }
    return map;
  }, [spec.tags]);

  // Preserve tag order from spec.tags, then append any remaining
  const orderedTags = useMemo(() => {
    const specTagNames = spec.tags?.map((t) => t.name) || [];
    const remaining = Object.keys(grouped).filter(
      (t) => !specTagNames.includes(t),
    );
    return [...specTagNames.filter((t) => grouped[t]), ...remaining];
  }, [spec.tags, grouped]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* ---- API Info Header ---- */}
        <header className="mb-10">
          <div className="flex items-start gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {spec.info.title}
            </h1>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20">
              v{spec.info.version}
            </span>
          </div>

          {spec.info.description && (
            <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)] max-w-2xl">
              {spec.info.description}
            </p>
          )}

          {spec.servers && spec.servers.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Base URL
              </span>
              <code className="rounded-md bg-[var(--bg-secondary)] px-3 py-1.5 text-sm font-mono text-[var(--text-primary)] ring-1 ring-inset ring-[var(--border)]">
                {baseUrl}
              </code>
              {spec.servers[0].description && (
                <span className="text-xs text-[var(--text-secondary)]">
                  &mdash; {spec.servers[0].description}
                </span>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="mt-8 border-b border-[var(--border)]" />
        </header>

        {/* ---- Endpoint Groups ---- */}
        {orderedTags.length > 0 ? (
          orderedTags.map((tag) => (
            <EndpointGroup
              key={tag}
              tag={tag}
              tagDescription={tagDescriptions[tag]}
              endpoints={grouped[tag]}
              spec={spec}
              baseUrl={baseUrl}
              defaultExpanded
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No endpoints defined in this specification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
