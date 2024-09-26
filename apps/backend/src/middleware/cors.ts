import { Context } from 'hono';
import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';
import { CorsConfig } from '../config';
import { ApplicationEnv } from '../factory';


// x-stainless-* headers are used by stainless (OpenAI's SDK)
export const corsMiddleware = createMiddleware<ApplicationEnv>((c, next) => {
	return cors({
		origin: CorsConfig.origin,
		allowHeaders: CorsConfig.allowHeaders,
		allowMethods: CorsConfig.allowMethods,
		exposeHeaders: CorsConfig.exposeHeaders,
		maxAge: 600,
		credentials: true,
	})(c, next);
});
