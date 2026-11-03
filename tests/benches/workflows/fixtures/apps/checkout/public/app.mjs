// Client entry. Must never import server secrets (W01 oracle greps the bundle).
const API_URL = "/api";
export function boot() {
  return `client boot against ${API_URL}`;
}
