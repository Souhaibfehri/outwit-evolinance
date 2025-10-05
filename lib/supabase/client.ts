import { createNoCookiesClient } from './no-cookies-client'

export function createClient() {
  // NUCLEAR OPTION: Use completely cookie-free client
  return createNoCookiesClient()
}