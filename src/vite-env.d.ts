/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface DepEntry {
  name: string
  version: string
  type: 'runtime' | 'build'
}

declare const __APP_DEPS__: DepEntry[]

/** Standard-Update-URL — gesetzt zur Build-Zeit in vite.config.ts.
 *  Kann per UI überschrieben werden → localStorage('update-url') */
declare const __DEFAULT_UPDATE_URL__: string
