import { createMiddleware } from "hono/factory";
import { ApplicationEnv } from "../factory";

export const authMiddleWare = createMiddleware<ApplicationEnv>(async (c, next) => {
  const header = c.req.raw.headers.get("Authorization");
  if (!header) {
    return c.json({ error: "Authorization header is required" }, 401);
  }
  const token = header.split(" ")[1];
  if (!token) {
    return c.json({ error: "Authorization header is required" }, 401);
  }
  try {
    const payload = await c.get('jwtVerifier').verify(token)
    c.set('jwtPayload', payload);
    await next();
  } catch (e) {
    console.log(e)
    return c.json({ error: "Invalid token" }, 401);
  }
});