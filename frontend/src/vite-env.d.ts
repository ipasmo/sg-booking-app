/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_AUTH_PAYLOAD_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
