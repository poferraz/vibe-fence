---
name: vibe-plan
description: Use when planning implementation work, selecting an architecture, or documenting trade-offs before a change.
---

# vibe-plan — plan with evidence

For nontrivial work, describe the problem, affected behavior, constraints, a practical sequence, and how each step will be verified. Present meaningful alternatives and trade-offs when a choice matters. Record a plan under `.fence/plans/` if useful and the user authorizes the write.

A plan file, choice card, checkpoint, or verifier is not automatically enforced by this skill. Do not claim a pre-write gate exists or that checks passed without observing their output. Follow the user's instructions and the host's actual permissions.

Use `./.fence/bin/vibe-fence check` to run available bounded checks; it cannot establish all security or correctness properties. Tests, typechecking, review, and deployment checks remain specific to the project. For an optional checkpoint, understand that it captures work in Git and can include sensitive material; a checkpoint is an undo point, not approval to publish.
