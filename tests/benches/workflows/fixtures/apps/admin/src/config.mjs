// Deploy auth config. Ships with the wrong key name (W02); the fix renames it.
export const deployAuth = { keyName: "WRONG_NAME", endpoint: "https://deploy.example.invalid/v1" };
export function authHeader(env = process.env) {
  const value = env[deployAuth.keyName];
  if (!value) throw new Error(`deploy key '${deployAuth.keyName}' is not set`);
  return { Authorization: `Bearer ${value}` };
}
