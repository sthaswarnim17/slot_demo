/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Comma-separated game server origins the deployed page may talk to via `?server=`. */
  readonly VITE_GAME_SERVERS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
