/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Production origin for canonical URLs; injected by vite.config.ts. */
  readonly VITE_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
