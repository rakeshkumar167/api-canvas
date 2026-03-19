import yaml from "js-yaml";
import type { OpenAPISpec, ParsedEndpoint, HttpMethod, SchemaObject } from "@/types/openapi";

const HTTP_METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete", "options", "head"];

export function parseOpenAPISpec(content: string): { spec: OpenAPISpec | null; error: string | null } {
  try {
    let parsed: unknown;

    // Try JSON first, then YAML
    const trimmed = content.trim();
    if (trimmed.startsWith("{")) {
      parsed = JSON.parse(content);
    } else {
      parsed = yaml.load(content);
    }

    if (!parsed || typeof parsed !== "object") {
      return { spec: null, error: "Invalid document: not an object" };
    }

    const spec = parsed as OpenAPISpec;

    if (!spec.openapi) {
      return { spec: null, error: "Missing 'openapi' version field" };
    }

    if (!spec.info) {
      return { spec: null, error: "Missing 'info' field" };
    }

    return { spec, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown parsing error";
    return { spec: null, error: message };
  }
}

export function getEndpoints(spec: OpenAPISpec): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  if (!spec.paths) return endpoints;

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (operation) {
        endpoints.push({
          path,
          method,
          operation,
          tag: operation.tags?.[0] || "default",
        });
      }
    }
  }

  return endpoints;
}

export function groupEndpointsByTag(endpoints: ParsedEndpoint[]): Record<string, ParsedEndpoint[]> {
  const groups: Record<string, ParsedEndpoint[]> = {};

  for (const endpoint of endpoints) {
    if (!groups[endpoint.tag]) {
      groups[endpoint.tag] = [];
    }
    groups[endpoint.tag].push(endpoint);
  }

  return groups;
}

export function resolveRef(spec: OpenAPISpec, ref: string): SchemaObject | undefined {
  const parts = ref.replace("#/", "").split("/");
  let current: unknown = spec;

  for (const part of parts) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current as SchemaObject;
}

export function resolveSchema(spec: OpenAPISpec, schema: SchemaObject): SchemaObject {
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref);
    return resolved ? resolveSchema(spec, resolved) : schema;
  }

  if (schema.allOf) {
    const merged: SchemaObject = { type: "object", properties: {}, required: [] };
    for (const sub of schema.allOf) {
      const resolved = resolveSchema(spec, sub);
      if (resolved.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties };
      }
      if (resolved.required) {
        merged.required = [...(merged.required || []), ...resolved.required];
      }
    }
    return merged;
  }

  return schema;
}

export function generateExample(spec: OpenAPISpec, schema: SchemaObject): unknown {
  const resolved = resolveSchema(spec, schema);

  if (resolved.example !== undefined) return resolved.example;

  switch (resolved.type) {
    case "string":
      if (resolved.enum) return resolved.enum[0];
      if (resolved.format === "date-time") return "2024-01-01T00:00:00Z";
      if (resolved.format === "date") return "2024-01-01";
      if (resolved.format === "email") return "user@example.com";
      if (resolved.format === "uri") return "https://example.com";
      if (resolved.format === "uuid") return "550e8400-e29b-41d4-a716-446655440000";
      return "string";
    case "number":
    case "integer":
      return resolved.default !== undefined ? resolved.default : 0;
    case "boolean":
      return resolved.default !== undefined ? resolved.default : true;
    case "array":
      if (resolved.items) {
        return [generateExample(spec, resolved.items)];
      }
      return [];
    case "object":
      if (resolved.properties) {
        const obj: Record<string, unknown> = {};
        for (const [key, prop] of Object.entries(resolved.properties)) {
          obj[key] = generateExample(spec, prop);
        }
        return obj;
      }
      return {};
    default:
      return null;
  }
}

export function generateCodeSnippet(
  method: string,
  path: string,
  baseUrl: string,
  body?: unknown,
  lang: "curl" | "javascript" | "python" = "curl"
): string {
  const url = `${baseUrl}${path}`;

  switch (lang) {
    case "curl": {
      let cmd = `curl -X ${method.toUpperCase()} '${url}'`;
      cmd += `\n  -H 'Content-Type: application/json'`;
      if (body) {
        cmd += `\n  -d '${JSON.stringify(body, null, 2)}'`;
      }
      return cmd;
    }
    case "javascript": {
      let code = `const response = await fetch('${url}', {\n  method: '${method.toUpperCase()}',\n  headers: {\n    'Content-Type': 'application/json',\n  },`;
      if (body) {
        code += `\n  body: JSON.stringify(${JSON.stringify(body, null, 2)}),`;
      }
      code += `\n});\n\nconst data = await response.json();\nconsole.log(data);`;
      return code;
    }
    case "python": {
      let code = `import requests\n\nresponse = requests.${method.toLowerCase()}(\n    '${url}',\n    headers={'Content-Type': 'application/json'},`;
      if (body) {
        code += `\n    json=${JSON.stringify(body, null, 2)},`;
      }
      code += `\n)\n\nprint(response.json())`;
      return code;
    }
  }
}

export const DEFAULT_SPEC = `openapi: "3.0.3"
info:
  title: Sample Pet Store API
  version: "1.0.0"
  description: |
    A sample API that uses a pet store as an example
    to demonstrate features of the API Canvas editor.

servers:
  - url: https://api.example.com/v1
    description: Production server

tags:
  - name: pets
    description: Everything about your Pets
  - name: store
    description: Access to pet store orders

paths:
  /pets:
    get:
      tags:
        - pets
      summary: List all pets
      description: Returns a list of all pets in the store
      operationId: listPets
      parameters:
        - name: limit
          in: query
          description: Maximum number of pets to return
          required: false
          schema:
            type: integer
            format: int32
            default: 20
        - name: status
          in: query
          description: Filter by status
          required: false
          schema:
            type: string
            enum:
              - available
              - pending
              - sold
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
        "500":
          description: Unexpected error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
    post:
      tags:
        - pets
      summary: Create a pet
      description: Creates a new pet in the store
      operationId: createPet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/NewPet"
      responses:
        "201":
          description: Pet created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
        "400":
          description: Invalid input

  /pets/{petId}:
    get:
      tags:
        - pets
      summary: Get a pet by ID
      description: Returns a single pet by its ID
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          required: true
          description: The ID of the pet to retrieve
          schema:
            type: integer
            format: int64
      responses:
        "200":
          description: A single pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
        "404":
          description: Pet not found

    put:
      tags:
        - pets
      summary: Update a pet
      operationId: updatePet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/NewPet"
      responses:
        "200":
          description: Pet updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"

    delete:
      tags:
        - pets
      summary: Delete a pet
      operationId: deletePet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        "204":
          description: Pet deleted

  /store/orders:
    get:
      tags:
        - store
      summary: List orders
      operationId: listOrders
      responses:
        "200":
          description: A list of orders
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Order"

    post:
      tags:
        - store
      summary: Place an order
      operationId: placeOrder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/NewOrder"
      responses:
        "201":
          description: Order placed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Order"

components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
          example: 1
        name:
          type: string
          example: "Buddy"
        tag:
          type: string
          example: "dog"
        status:
          type: string
          enum:
            - available
            - pending
            - sold
          example: "available"

    NewPet:
      type: object
      required:
        - name
      properties:
        name:
          type: string
          example: "Buddy"
        tag:
          type: string
          example: "dog"
        status:
          type: string
          enum:
            - available
            - pending
            - sold

    Order:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        petId:
          type: integer
          format: int64
          example: 1
        quantity:
          type: integer
          format: int32
          example: 1
        status:
          type: string
          enum:
            - placed
            - approved
            - delivered
          example: "placed"
        shipDate:
          type: string
          format: date-time

    NewOrder:
      type: object
      required:
        - petId
        - quantity
      properties:
        petId:
          type: integer
          format: int64
        quantity:
          type: integer
          format: int32

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: integer
          format: int32
        message:
          type: string
`;
