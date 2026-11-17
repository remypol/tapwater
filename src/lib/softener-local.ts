/**
 * How many homeowners near a town have asked us for softener quotes. Server
 * only: it reads the leads table.
 */

import { getSupabase, supabase } from "./supabase";
import { waitingByArea } from "./lead-delivery";
import { REQUEST_WINDOW_DAYS } from "./softener-sizing";

let requestsCache: Promise<Map<string, number>> | null = null;

/** Quote requests per postcode area. One query per process; an empty map if the database is unreachable. */
export function softenerRequestsByArea(): Promise<Map<string, number>> {
  requestsCache ??= (async () => {
    if (!supabase) return new Map<string, number>();
    try {
      return await waitingByArea(getSupabase(), REQUEST_WINDOW_DAYS);
    } catch {
      return new Map<string, number>();
    }
  })();
  return requestsCache;
}
