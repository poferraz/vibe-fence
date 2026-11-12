# Can a builder tell whether the change worked?

Field guide for the [post-hackathon product direction](2026-11-11-product-direction.md). This is a proposed pilot, not a report of results. Test the card today; treat a new automatic check or restore command as a prototype until it passes its own trial.

## A card to try now

Paste this into your coding chat. For later sessions, add it to your tool’s project instructions or [Lovable’s personal instructions](https://docs.lovable.dev/features/knowledge#personal-instructions) under Account settings. Append it to existing text; remove just the card after the trial. These are requests to the assistant. They do not install a scanner or prove any check ran.

> Help me make one change at a time. Start by saying what I should be able to do when it works. Keep my other work intact.
>
> Try the thing I asked for before calling it done. If it should save something, close or reload it and look again. Tell me what you actually tried, what happened, and one thing you couldn’t check. If you can’t try it yourself, give me one short step I can do.
>
> If a change could expose a private key, delete data, cost money, or publish my work, pause before that action. Explain the consequence and suggest a safer next step. Don’t ask me to paste keys. If we need to go back, show what would change first.

## Run the comparison

Recruit 12 builders who use a coding assistant and do not usually review code. Six use Claude Code with local Git; six use Lovable in their browser. Within each group, pair people by experience, then randomly assign one per pair to their usual setup and one to the companion. Use the same starter, time limit (25 minutes), task wording, and host settings within each pair. Each person sees the task once. Keep results separate by route: the local group tests card plus hooks; the browser group tests the card alone.

Prepare disposable copies of a small favorites list. The star icon changes on click but the selection disappears on reload. Include an unrelated footer credit. Separately prepare a client edit referencing an **unset** variable, `import.meta.env.VITE_SERVICE_SECRET`, and a repair fixture with that edit already present. No credentials, external service, or production data. Verify each starting state. Supply a pinned local package and one install instruction; local companion participants do setup themselves. Browser participants use a disposable Lovable project without connecting Git.

1. **Give the task:** “I want to mark a favorite and find it again when I come back. Keep the footer as it is. Tell me when you’d be comfortable sharing this preview, and why.” Don’t suggest reloading or inspect the code for them.
2. **Observe:** Start the timer before setup. Record the first “done,” then independently mark an item and reload. Check the footer against the reference. Ask, “Could you tell whether someone on another device would see the same favorite?” Without evidence, “I don’t know” is a useful answer.
3. **Check protection and repair:** Have the tool attempt the prepared client edit. Examine the file; record assistant refusal, observed editor hook denial, or edit landed. In a separate local copy with the edit staged, try a commit to test Git independently. In Lovable, ask the participant to find the native Quick scan result if available without publishing; record whether they can distinguish it from the chat's advice. Give everyone the repair fixture: remove the unused browser reference and keep the footer. Verify both results. Never push or publish.
4. **Check recovery:** In another copy, change the heading with the assistant, then add a separate user note. Ask to restore the old heading and keep the note. Count success only when both contents match. An undo command exiting successfully is insufficient.

## Score and decide

Record setup time, moderator help, unneeded interruptions, observed hook or Git events, and verified outcomes. Ask each builder what was checked, what remains unknown, and what they would do next. Record anonymous tallies and short paraphrases only; collect no prompts, files, accounts, keys, or screen recordings. Stop if a task would require payment, an external connection beyond the existing editor, or a real deployment.

**Proposed pilot thresholds:** In each companion group, at least 2 of 3 should set up unaided within five minutes. Advance that route to a larger trial only if at least 2 of 3 verify persistence, retain the footer and correctly describe the limits, and more do so than in the matched controls. Require three observed local hook denials, each followed by a successful safe edit, before advertising that specific editor action as protected. Pause a route for any skipped check presented as a pass, unexpected data transfer, or lost unrelated edit. If browser users benefit but miss the paste step, test easier placement before adding rules. A tie is inconclusive; six pairs cannot establish population rates or retention.

**Check again after a week.** Invite participants who want to continue to open a fresh session and make an ordinary change in the same project. Did the help appear without repasting or a reminder? Did they keep it enabled, and why? Record how many returned and kept it, by route, including nonresponses. If help disappears across sessions or people disable it after harmless edits, fix that before expanding to another editor.
