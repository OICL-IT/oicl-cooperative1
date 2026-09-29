/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REQUIRE_MEMBERSHIP_REFEREES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
