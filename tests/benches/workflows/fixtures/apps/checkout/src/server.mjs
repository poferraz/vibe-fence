// Server-only deploy config: the KEY NAME is code; the value stays in the environment.
export function deployConfig(env = process.env) {
  const key = env.DEPLOY_KEY;
  if (!key) throw new Error("DEPLOY_KEY is not set");
  return { auth: "bearer", keyPresent: true };
}
