.PHONY: frontend backend

frontend:
	pushd apps/frontend && npm run dev
	popd

backend:
	pushd apps/backend && npm run dev
	popd
