# Captured AI answers — September 8, 2026

The mock's three insurance-receptionist questions were submitted independently to ChatGPT, Claude, and Perplexity. All nine completed responses are in `fixtures/superagent/ai-answers.json`. The UI uses those records directly, including the complete answer, collection time, displayed model, collection method, and available source links.

| Engine | Capture | Model label |
| --- | --- | --- |
| ChatGPT | Three fresh temporary, unpersonalized web chats | `Latest`, thinking effort `High`; no specific underlying version displayed |
| Claude | Three fresh incognito web chats | `Fable 5.1`, effort `Extra`, as displayed in the app |
| Perplexity | Three calls to the official Sonar API | `sonar` |

Each service received the exact question shown in the mock, without a target-brand recommendation or a follow-up prompt. Perplexity also received the system instruction `Answer in approximately 250 words.` and a 600-token response limit. All three API responses finished normally with `finish_reason: stop`. See [Perplexity's API reference](https://docs.perplexity.ai/api-reference/sonar-post).

## Preserved evidence

- `chatgpt-captures.json`, `claude-captures.json`, and `perplexity-captures.json` retain collection metadata and complete responses.
- Each engine directory contains the three transcripts. `perplexity/` also retains the raw API response bodies, without credentials or request headers.
- `manifest.json` records SHA-256 hashes and character counts of the response strings before the transcript file's final newline. The frontend integrity checks compare the mock fixture with these transcripts.

Web captures preserve rendered answer text. ChatGPT comparison tables retain tab-separated cells. Claude's first answer included a comparison card outside the main Markdown block; its complete accessible text is prepended to the body. All three Claude transcripts were checked against their original browser text using character counts and checksums. Excerpts normalize whitespace and emphasis and truncate a selected passage; the full responses remain unchanged.

The ChatGPT and Claude records include the visible citation URLs. Collapsed `+N` citation groups were not expanded, so the saved links are not a claim to include every underlying source. The Perplexity records include the complete citation array returned by the API; numbered inline references keep the original IDs. The ChatGPT and Claude missed-call answers did not contain source links.

Temporary/incognito chats did not provide persistent conversation links. No public share links were created. Web-app captures and Sonar API outputs are labeled separately in the mock. This is one dated observation per question and engine, not a repeatability study or a live-monitoring result. The answers preserve the engines' claims and caveats; vendor pricing and feature claims in those answers were not independently verified during capture.
