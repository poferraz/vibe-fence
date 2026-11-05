# Reviewer guide

The [README](../README.md#get-started) shows how to build the current source and run a synthetic staged-file check in a disposable Git project. This does not require a Meta key and does not establish host interception.

## Exercise the Muse Code hook

Use the scratch project created by the README. Muse Code and access to a Meta model are required for this live test. The optional `--explain` call also requires Meta Model API configuration and may incur a provider charge. Do not put a real credential in the project.

1. In the scratch project, replace `example.tsx` with `export const demo = true;` and start a **new** Muse Code session. Trust the scratch project if prompted so its project hook can load.
2. Ask Muse Code to add the following fictional reference using its file-editing tool. If the hook blocks the action, ask Muse not to retry:

   ```text
   const paymentKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
   ```

3. Inspect Muse's response and the file. The expected result for this supported synthetic action is an SEC-01 block and no added reference. If the hook is not invoked or the edit lands, report the actual result; local `doctor` output alone does not prove host enforcement.

These checks are pattern-based and bounded, not a sandbox. [Evaluation evidence](EVIDENCE.md) describes observed tests and limits, and [provenance](BUILD-PROVENANCE.md) separates earlier work from hackathon work.
