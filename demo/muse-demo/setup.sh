#!/bin/sh
# Create a disposable, fictional checkout project for the recording.
set -eu

VF_DEMO_DIR=$(mktemp -d "${TMPDIR:-/tmp}/vibe-fence-film.XXXXXX")
mkdir -p "$VF_DEMO_DIR/app"
cat > "$VF_DEMO_DIR/app/page.tsx" <<'PAGE'
export default function Page() {
  return <main><h1>My demo checkout</h1></main>;
}
PAGE
git -C "$VF_DEMO_DIR" init -q
git -C "$VF_DEMO_DIR" config --local core.hooksPath .git/hooks
git -C "$VF_DEMO_DIR" add app/page.tsx
git -C "$VF_DEMO_DIR" -c user.name='Demo Actor' -c user.email='demo@example.invalid' -c commit.gpgsign=false commit -qm 'Demo starter'
printf 'Your disposable demo project is ready:\n%s\n' "$VF_DEMO_DIR"
