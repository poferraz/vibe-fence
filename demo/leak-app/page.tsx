// Demo fixture — tiny app shell. Reads only a benign public variable.
// For the synthetic staged-scan walkthrough, see ../../docs/REVIEW.md.
export default function Page() {
  return <h1>{process.env.NEXT_PUBLIC_APP_NAME ?? "leak-app-demo"}</h1>;
}
