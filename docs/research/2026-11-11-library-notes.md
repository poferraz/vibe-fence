# What the AI-Research library contributes to Vibe Fence

**Question:** What help could a first-time builder benefit from without having to remember a prompt, pick a model, or connect a service?

**Selection:** The November 9 catalog inventories 875 items, including 133 PDFs (3,776 pages). I searched the catalog and indexed text for vibe coding, beginner studies, security, and evaluation; checked the four vibe-coding guides and selected relevant pages from the original PDFs. Eight indexed PDFs contained the exact phrase “vibe coding.” These are search and selection counts, not counts of studies reviewed in full. Paths below start at the supplied `AI-Research/` folder; page numbers refer to its saved PDFs.

## Existing sources, reread for this decision

- `Research/Research-CodingAgents-ContextFilesEvalPaper.pdf`, pp. 2, 8 — [Gloaguen et al., saved v1](https://arxiv.org/abs/2602.11988v1) found that generated instructions slightly reduced task success on average, developer-written ones slightly improved it, and context files raised inference cost by over 20%; these Python-heavy benchmarks measured neither beginner outcomes nor security, so they support testing a short project-specific instruction rather than promising protection from a rulebook.
- `Prompting/Prompting-VibeCoding-PracticeGuide.pdf`, pp. 1, 3 — In [Zed’s session](https://zed.dev/blog/vibe-coding-in-practice), an engineer with over 20 years of experience describes an agent declaring success with only a placeholder; one expert’s account supplies a scenario for testing whether beginners can tell what actually ran.
- `Prompting/Prompting-VibeCoding-UltimateGuide.pdf`, p. 3 — Two readers of the [community guide](https://www.reddit.com/r/ClaudeAI/comments/1kivv0w/the_ultimate_vibe_coding_guide/) separately ask how to avoid checking security advice manually and how to ask a question without the agent editing; these self-selected comments describe concrete friction but cannot establish its prevalence.

The October deep-read (`synthesis/deep-reads/deepread-vibe-coding.md` in the working library) already covered all four guides; the [claims register](CLAIMS.md) already cites the context benchmark. The two readers’ questions add detail the earlier summary omitted. None of these are independent replications, and the commercial prompt collection gives no measured reason to ship prompts as the product.

## Additional design and evaluation references

- `Agents/Agents-ADK-SafetyGuide.pdf`, pp. 1, 3 — [Google’s safety guidance](https://adk.dev/safety/) distinguishes a tool’s enforced permissions from instructions to a model; this is platform guidance, so verify that each supported coding tool actually exposes a place where Fence can stop the action.
- `Agents/Agents-ADK-EvaluationGuide.pdf`, pp. 1–4 — [Google’s evaluation guide](https://adk.dev/evaluate/) separates the actions taken from the final answer; use a harmless example and an observable outcome to test each installation, since a reassuring message alone cannot show the check ran.
- `Agents/Agents-Fundamentals-PracticalGuide.pdf`, pp. 26–27, 31 — [OpenAI’s guide](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) recommends considering reversibility and permissions when deciding to interrupt; that is design advice, so measure unnecessary interruptions on ordinary edits alongside missed serious problems.

**Unanswered locally:** I found no adoption study of the intended beginners in the four guides. Observe people installing Fence in their usual tool and explaining three outcomes in their own words: “the action stopped,” “the change was checked afterward,” and “no check ran here.”
