export const RateLimiterConfig = {
	windowInMilliseconds: 24 * 60 * 60 * 1000,
	requestLimit: 10000,
};

export const CorsConfig = {
	origin: ['http://localhost:5173', 'https://whisperer.pages.dev'],
	allowHeaders: [
		'Authorization',
		'Content-Type',
		'X-Custom-Header',
		'Upgrade-Insecure-Requests',
		'x-stainless-os',
		'x-stainless-lang',
		'x-stainless-package-version',
		'x-stainless-runtime',
		'x-stainless-runtime-version',
		'x-stainless-arch',
	],
	allowMethods: ['POST', 'PUT', 'DELETE', 'OPTIONS'],
	exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
};

export const SupportedModels = {
	chat: ['gpt-4o-mini', 'gpt-4o', 'gpt-4o-2024-08-06', 'gpt-4o-2024-05-13', 'gpt-4o-mini-2024-07-18'],
    embeddings: ["text-embedding-3-small"]
};

const KILO_BYTE = 1 * 1024;
const MEGA_BYTE = KILO_BYTE * 1024;

export const ChatConfig = {
	maxBodySize: KILO_BYTE * 50,
}

export const EmbeddingsConfig = {
	maxBodySize: MEGA_BYTE * 5,
}