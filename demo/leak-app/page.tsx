// Demo fixture — tiny app shell. Reads only the benign public var; the leak
// lives in config.env next to this file and is activated at demo time (see ../CUES.md).
export default function Page() {
  return <h1>{process.env.NEXT_PUBLIC_APP_NAME ?? "leak-app-demo"}</h1>;
}
