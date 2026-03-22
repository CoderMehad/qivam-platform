import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { register, login, createInvitation } from "@qivam/core/auth";
import type { AppEnv } from "../types.js";
import {
  registerSchema,
  loginSchema,
  tokenResponse,
  inviteSchema,
  inviteResponse,
} from "@qivam/core/schemas/auth";
import { errorResponse } from "@qivam/core/schemas/common";
import { jwtAuth } from "../middleware/admin-auth.js";

export const authRoutes = new OpenAPIHono<AppEnv>();

// ── Register ────────────────────────────────────────────────────────────────

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  request: {
    body: { content: { "application/json": { schema: registerSchema } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: tokenResponse } },
      description: "Admin registered",
    },
    409: {
      content: { "application/json": { schema: errorResponse } },
      description: "Email already registered",
    },
  },
});

authRoutes.openapi(registerRoute, async (c) => {
  const data = c.req.valid("json");
  const result = await register(data);
  return c.json(result, 201);
});

// ── Login ───────────────────────────────────────────────────────────────────

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: tokenResponse } },
      description: "Login successful",
    },
    401: {
      content: { "application/json": { schema: errorResponse } },
      description: "Invalid credentials",
    },
  },
});

authRoutes.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid("json");
  const result = await login(email, password);
  if (!result) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  return c.json(result, 200);
});

// ── Invite ──────────────────────────────────────────────────────────────────

const inviteRoute = createRoute({
  method: "post",
  path: "/invite",
  middleware: [jwtAuth],
  request: {
    body: { content: { "application/json": { schema: inviteSchema } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: inviteResponse } },
      description: "Invitation created",
    },
    403: {
      content: { "application/json": { schema: errorResponse } },
      description: "Not authorized for this mosque",
    },
  },
});

authRoutes.openapi(inviteRoute, async (c) => {
  const admin = c.get("admin");
  const { email, mosqueId } = c.req.valid("json");

  if (admin.mosqueId !== mosqueId) {
    return c.json({ error: "You can only invite admins to your own mosque" }, 403);
  }

  const invitation = await createInvitation(admin.id, email, mosqueId);
  return c.json(invitation, 201);
});
