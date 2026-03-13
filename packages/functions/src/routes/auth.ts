import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { register, login } from "@openislam/core/auth";
import type { AppEnv } from "../types.js";
import { registerSchema, loginSchema } from "../schemas/auth.js";

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const data = c.req.valid("json");
  try {
    const result = await register(data);
    return c.json(result, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return c.json({ error: message }, 409);
  }
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const result = await login(email, password);
  if (!result) {
    return c.json({ error: "Invalid email or password" }, 401);
  }
  return c.json(result);
});
