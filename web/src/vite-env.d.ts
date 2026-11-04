/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'http';
  readonly VITE_API_BASE_URL?: string;
  /** Endpoint groups served over HTTP while the rest stay on mocks, e.g. "cards,dice". */
  readonly VITE_API_HTTP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
