import { createMiddleware } from "hono/factory"
import { ApplicationEnv } from "../factory"
import { rateLimiter } from "hono-rate-limiter";
import { DurableObjectStore } from "@hono-rate-limiter/cloudflare";
import { RateLimiterConfig } from "../config";

export const rateLimiterMiddleware = createMiddleware<ApplicationEnv>(async (c, next) => {
    return rateLimiter<ApplicationEnv>({
        windowMs: RateLimiterConfig.windowInMilliseconds,
        limit: RateLimiterConfig.requestLimit,
        standardHeaders: "draft-6",
        keyGenerator: async (c) => {
            const jwtPayload = c.get('jwtPayload')
            if (!jwtPayload.sub) {
                throw new Error("Invalid token")
            }
            return jwtPayload.sub
        },
        store: new DurableObjectStore({ namespace: c.env.CACHE }),
    })(c, next)
})