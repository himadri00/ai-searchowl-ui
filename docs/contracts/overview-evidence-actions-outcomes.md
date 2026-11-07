# Overview Evidence, Actions, and Outcomes Contract

Status: Draft for product, frontend, and backend review  
Applies to: Overview, Insights, Prompts, Gap Analysis, Domains, URLs, chat details, and Actions  
Normative terms: **MUST** is required, **SHOULD** is recommended, and **MAY** is optional.

## 1. Purpose

The product must help a user answer four questions without making them search across disconnected screens:

1. **What happened?**
2. **Why did it happen?**
3. **What should I do?**
4. **Did the action work?**

The existing product already collects most of the evidence needed for the first question:

- Brand visibility, mentions, citations, positions, share of voice, sentiment, source use, and win rate
- Prompt and complete answer text
- Model identity
- Brand and competitor positions
- Source domains
- Exact source URL host and path on URL, Domain, and Gap Analysis screens
- Daily brand, domain, URL, and model trends

This contract connects that existing evidence to explanations, actions, and measurable follow-up. It does not require a second tracking pipeline.

## 2. Product truth rules

1. The UI MUST distinguish an observed fact from an inferred explanation.
2. The UI MUST NOT claim that an action caused a result. It may say that a change was observed after an action.
3. A reason MUST NOT be displayed as fact unless supporting evidence is attached.
4. Every recommended action MUST link back to the prompt, model, chat, competitor, or source URL that triggered it.
5. Exact citation claims MUST display a clickable URL, not only a source domain.
6. Missing, loading, unavailable, and zero-result states MUST use different messages.
7. Sample data MUST remain clearly labelled and MUST NOT be mixed with workspace data.

## 3. User outcome contracts

### 3.1 What happened?

The product MUST show:

- The buyer prompt
- The AI model
- The complete answer
- Whether the tracked brand was recommended, mentioned, cited, or missing
- The tracked brand's position when available
- The leading competitor and its position when available
- Citation count
- Clickable exact source URLs
- The observation date and selected date range

Existing support:

- Chat detail already shows model, prompt, answer, source domains, and positions.
- URL detail already shows the exact host and path, related prompts, model retrievals, brands, and chats.
- Domain detail already shows URL paths and related chats.
- Prompt runs already return an answer per engine, target citation state, and target position.

**CHANGE REQUIRED**

- Connect chat citations to exact URL records instead of displaying only host names.
- Show the model directly in URL and Domain chat tables, not only after opening a chat.
- Make exact URLs clickable both externally and to their internal URL detail page.
- Deduplicate URL prompt and source rows by stable ID before rendering.

### 3.2 Why did it happen?

The product MUST present an evidence-based explanation with one of these states:

- `observed`: directly supported by the answer, positions, or cited URLs
- `inferred`: a plausible interpretation supported by evidence but not proven
- `unknown`: the available data cannot explain the result

Allowed observed explanation:

> Perplexity ranked InVideo first and did not include your brand. The answer cited these URLs.

Allowed inferred explanation:

> Possible reason: the cited competitor pages directly answer this buyer question. This is an interpretation, not a confirmed cause.

Required unknown explanation:

> We can see the result, but the available evidence does not show why the model chose it.

The product MUST NOT generate claims such as “the competitor won because its pricing page is better” unless the analysis provides evidence and marks the conclusion correctly.

**CHANGE REQUIRED**

- Add a structured explanation object linked to evidence.
- Display “Observed,” “Possible reason,” or “Reason unavailable” in the UI.
- Correct Insights ranking tooltips so they show the selected competitor's metrics rather than the active brand's metrics.

### 3.3 What should I do?

Every action MUST include:

- Stable action ID
- Clear title written as a task
- Specific description
- Priority
- Status
- Target page or page type
- Related prompt
- Related model
- Triggering chat or run result
- Supporting exact URLs
- Evidence-based rationale
- Creation date
- Completion date when completed

An action MUST be specific enough to complete without additional interpretation.

Good:

> Add a public pricing comparison table to `/pricing`. This action is linked to the Perplexity prompt “Best tools for faceless video creation?” where your brand was missing and two competitor pricing pages were cited.

Not acceptable:

> Improve your content.

**CHANGE REQUIRED**

- Expand the Actions API beyond translated task IDs and tags.
- Persist action status on the server.
- Implement the full `/actions` page currently linked from Overview.
- Give each action direct links to its prompt, chat, model, competitor, and source URLs.
- Replace the repeated “No wrong claims are open” message with group-specific empty states.

### 3.4 Did the action work?

The existing daily tracking pipeline MUST be reused.

When an action is marked complete, the product MUST:

1. Save the completion timestamp.
2. Save the prompt, model, target brand, and target URL scope.
3. Save the latest result before completion as the baseline.
4. Evaluate subsequent completed daily runs for the same scope.
5. Compare the baseline with the latest eligible result.
6. Show one outcome state:
   - `waiting_for_run`
   - `insufficient_data`
   - `improved`
   - `no_change`
   - `declined`

The result MUST use correlation-safe language:

> Visibility improved after this action was completed.

The result MUST NOT say:

> This action caused visibility to improve.

**CHANGE REQUIRED**

- Link actions to existing daily run results.
- Store an action baseline and latest comparison.
- Display before and after values, run dates, and the number of runs observed.
- Do not evaluate failed, partial, or incompatible runs.

## 4. Data contracts

### 4.1 Exact citation source

Chat detail responses MUST keep the existing `sources: string[]` field for backward compatibility and add `sourceUrls`.

```ts
type CitationSource = {
  id: string
  url: string
  host: string
  path: string
  title: string | null
  citationIndex: number | null
  sourceUrlId: string | null
  isTrackedBrand: boolean
}
```

Rules:

- `url` MUST be an absolute `http` or `https` URL.
- `host` and `path` MUST be derived from the canonical URL.
- `sourceUrlId` SHOULD link to `/prompts/urls/{id}` when a source record exists.
- Duplicate canonical URLs MUST appear once.
- The UI MUST still show the host when an exact URL is unavailable and explain that the exact page was not returned.

### 4.2 Result verdict

```ts
type ResultVerdict = {
  state: 'recommended' | 'mentioned' | 'cited' | 'missing'
  trackedBrandId: string
  trackedBrandPosition: number | null
  winnerBrandId: string | null
  winnerBrandName: string | null
  winnerPosition: number | null
}
```

Rules:

- Position `1` means the first recommended brand.
- `null` means the position was not observed; it MUST NOT be converted to `0`.
- A winner MUST NOT be invented when no ranked brand was observed.

### 4.3 Explanation

```ts
type ResultExplanation = {
  status: 'observed' | 'inferred' | 'unknown'
  summary: string
  evidence: EvidenceReference[]
}

type EvidenceReference = {
  type: 'chat' | 'prompt_run_result' | 'source_url' | 'brand_position'
  id: string
  label: string
  href: string | null
}
```

Rules:

- `observed` and `inferred` explanations MUST contain at least one evidence reference.
- `unknown` MUST contain a clear user-facing explanation of what data is missing.
- Explanations MUST not contain unsupported ranking guarantees or predicted gains.

### 4.4 Action

```ts
type ActionPriority = 'critical' | 'high' | 'medium' | 'low'
type ActionStatus = 'todo' | 'in_progress' | 'done' | 'dismissed'

type ActionItem = {
  id: string
  group: 'site_readability' | 'owned_pages' | 'external_mentions' | 'incorrect_claims'
  title: string
  description: string
  priority: ActionPriority
  status: ActionStatus
  recommendedChange: string
  rationale: string
  target: {
    type: 'existing_url' | 'new_page' | 'external_source' | 'technical'
    sourceUrlId: string | null
    url: string | null
  }
  trigger: {
    promptId: string | null
    promptText: string
    model: string
    chatId: string | null
    runResultId: string | null
    observedAt: string
  }
  evidence: EvidenceReference[]
  createdAt: string
  updatedAt: string
  completedAt: string | null
  outcome: ActionOutcome | null
}
```

Rules:

- `title`, `recommendedChange`, and `rationale` MUST come from the API, not translation-key IDs.
- `done` requires `completedAt`.
- Reopening an action MUST preserve its previous completion and evaluation history.
- An action without evidence MUST be marked as a general recommendation and MUST not be presented as a result-specific fix.

### 4.5 Action outcome

```ts
type OutcomeSnapshot = {
  runId: string
  observedAt: string
  visibility: number | null
  cited: boolean | null
  position: number | null
  winnerBrandId: string | null
}

type ActionOutcome = {
  status: 'waiting_for_run' | 'insufficient_data' | 'improved' | 'no_change' | 'declined'
  baseline: OutcomeSnapshot
  latest: OutcomeSnapshot | null
  runsObserved: number
  firstEvaluatedAt: string | null
  lastEvaluatedAt: string | null
  summary: string
}
```

Rules:

- Baseline and latest snapshots MUST use the same prompt, model, country, and tracked brand.
- A date-range aggregate MUST NOT be compared with a single-run value.
- The comparison method MUST be deterministic and documented.
- `summary` MUST use “after” language, not causal language.

## 5. API changes

### Existing endpoints to extend

#### `GET /v2/prompt-runs/chats/{chat_id}`

Add:

- `sourceUrls: CitationSource[]`
- `verdict: ResultVerdict`
- `explanation: ResultExplanation`

Keep existing:

- `models`
- `prompt`
- `answer`
- `sources`
- `positions`
- `citations`
- `links`

#### `GET /v2/sources/{source_id}`

Ensure URL-detail chats include:

- `models`
- `promptId`
- `prompt`
- `positions`
- `sourceUrls`
- `createdAt`

Domain-detail chats MUST use the same chat summary shape as URL-detail chats.

#### `GET /v2/actions`

Return `ActionItem[]` or grouped `ActionItem[]` records. Do not return only task IDs and tags.

The endpoint MUST support large workspaces without returning every action at once.

Supported query parameters:

```ts
type ActionsQuery = {
  status?: ActionStatus[]
  group?: ActionItem['group']
  priority?: ActionPriority
  search?: string
  sort?: 'impact' | 'priority' | 'newest'
  cursor?: string
  limit?: number // default 25, maximum 100
}
```

The response MUST include a stable cursor and totals:

```ts
type ActionsPage = {
  groups: Array<{
    id: 'read' | 'pages' | 'mentions' | 'claims'
    total: number
    tasks: ActionItem[]
  }>
  nextCursor: string | null
  totalActions: number
  totalWorkItems: number
}
```

Related prompt-level actions SHOULD be grouped by stable server-provided work-item ID using action rule, target type, and canonical target URL. The list response SHOULD return compact work-item summaries; full prompt evidence MAY be loaded when the user opens a work item. Search, filtering, sorting, and pagination MUST happen on the server so a workspace with thousands of prompts does not send or render every action.

### New mutations

#### `PATCH /v2/actions/{action_id}`

Request:

```ts
type UpdateActionRequest = {
  status: ActionStatus
}
```

The server MUST set or clear `completedAt` consistently and return the updated `ActionItem`.

### Outcome evaluation

The backend MAY expose outcomes through either:

- `GET /v2/actions/{action_id}/outcome`, or
- the `outcome` field on `GET /v2/actions`

One approach must be selected and used consistently.

## 6. UI changes by page

### Overview

**CHANGE REQUIRED**

- Keep aggregate metrics and trends.
- Add clear deep links from summary evidence to the relevant prompt, chat, URL, and action.
- Show only the highest-priority open actions in the preview.
- Show action outcome status when available.
- Use group-specific empty states.

### Chat detail

**CHANGE REQUIRED**

- Show one clear model label.
- Show the tracked-brand verdict and leading competitor.
- Display clickable exact source URLs with titles.
- Add an evidence-based explanation section.
- Add “Create action” or “View related action.”

### URLs

**CHANGE REQUIRED**

- Render the complete canonical URL as an external link.
- Keep the internal URL-detail link.
- Add a model column to the chat table.
- Deduplicate prompts and chats using stable IDs.
- Make the relationship URL → prompt → model → chat visible.

### Domains

**CHANGE REQUIRED**

- Add `models` to the domain chat response and table.
- Preserve links from a domain page to URL detail.
- Show exact page URLs, not only paths, where space allows.

### Insights

**CHANGE REQUIRED**

- Fix ranking tooltips to use the ranked competitor's metrics.
- Add a link from a ranking result to supporting chats or prompts.
- Do not label the top-ranked brand as the reason for the ranking.

### Prompts

Existing per-engine run results SHOULD be retained.

**CHANGE REQUIRED**

- Allow a completed run result to open the same normalized chat/evidence view.
- Link cited source URLs to URL detail records.

### Actions

**CHANGE REQUIRED**

- Implement `/actions`.
- Support filters for status, priority, group, model, and date.
- Show evidence, target, rationale, status, completion date, and outcome.
- Persist status changes through the API.

## 7. Required correctness fixes

These changes are required before the new workflow is considered complete:

1. Deduplicate repeated prompt IDs returned or rendered on URL detail.
2. Remove duplicate React keys for competitors, prompts, and sources.
3. Correct Insights ranking tooltip metrics.
4. Do not show `0` when a position is unknown.
5. Do not display citation domains as though they are exact page URLs.
6. Ensure selected date and model filters apply consistently to summaries and chat evidence.
7. Replace the generic repeated action empty message with a message specific to each action group.
8. Prevent the URL list's local filters from hiding all rows without clearly identifying which filters must be reset.

## 8. User-facing states

### No exact URL

> We found the source domain, but this AI result did not return the exact page URL.

### No explanation

> We can show who appeared and which sources were used, but the available evidence does not explain why the model chose them.

### No actions

> No page fixes are open for this brand. We will add one here when a tracked answer reveals a specific gap.

Each action group MUST use wording that names that group. For example, an empty incorrect-claims group must not be used for empty page or mention groups.

### Waiting for outcome

> This action is complete. We are waiting for the next successful daily run for the same prompt and model.

### Insufficient outcome data

> We cannot compare this action yet because the next run used a different model, country, or prompt.

### Improved outcome

> The result improved after this action was completed. Before: not mentioned. Latest: position 3.

## 8.1 Prompt visibility and page-fit recommendations

Automatic recommendations MUST use the latest successful result for each prompt, model, and country. Repeated runs and models MUST be consolidated into one action per tracked prompt.

The action MUST show:

- Models where the tracked brand is missing.
- Models where the brand is named but its site is not cited.
- Frequently named competitors and recurring exact cited source URLs.
- The best matching audited owned page, or a clear statement that no credible page match was found.
- The prompt concepts not clearly covered in the bounded audited page excerpt.

Historical successful results MUST be reconciled so a missed worker callback does not leave a visibility gap without an action. Reconciliation runs after a successful prompt run, after a site audit, and on a daily backend schedule.

General technical audit findings MUST NOT outrank observed prompt visibility gaps. Repeated findings of the same type SHOULD be consolidated, and optional `llms.txt` guidance MUST be low priority.

When a consolidated prompt action is completed, its baseline and later outcome MUST aggregate the same model-and-country checks. The comparison reports mention rate and citation rate across that set. A partial later run MUST wait for the missing compatible checks instead of reporting a misleading improvement or decline.

## 9. Acceptance criteria

The contract is satisfied only when all of the following pass:

1. A user can open a chat and see its model, prompt, complete answer, tracked-brand verdict, leading competitor, positions, and exact clickable source URLs.
2. A user can move from a chat citation to the corresponding internal URL detail page.
3. A user can see the model directly in Overview, URL, and Domain chat tables.
4. Every result explanation is labelled observed, inferred, or unknown.
5. No explanation presents an inference as a confirmed cause.
6. Every result-specific action links to at least one prompt/run/chat and one supporting evidence item.
7. Marking an action done survives refresh and records `completedAt`.
8. The full `/actions` page lists and filters all actions.
9. A completed action shows a baseline and evaluates later compatible daily runs.
10. Outcome copy says “after the action,” never “caused by the action.”
11. Unknown positions display as unavailable, not position zero.
12. Exact URL, prompt, and source lists render without duplicate-key errors.
13. Empty, unavailable, loading, and API-error states are visually and textually distinct.
14. Insights ranking tooltips show the selected competitor's metrics.
15. Existing Overview, URL, Domain, Prompt, and Insights trends continue to work without schema regressions.
16. Every latest prompt/model result that is missing or uncited is represented by one consolidated prompt action.
17. Prompt actions name affected models, recurring competitors/sources, and an evidence-backed existing or new page target.
18. Historical gaps are backfilled without requiring users to rerun prompts manually.

## 10. Delivery order

### Phase 1 — Correctness and connected evidence

- Fix duplicate rows and keys.
- Fix ranking tooltip metrics.
- Add exact `sourceUrls` to chat details.
- Add model columns and evidence deep links.
- Correct empty states.

### Phase 2 — Action contract and Actions page

- Expand the Actions API.
- Add evidence-linked action cards.
- Implement persistent status changes.
- Implement `/actions`.

### Phase 3 — Daily outcome evaluation

- Capture action baselines.
- Compare compatible later daily runs.
- Display before/after outcomes.

### Phase 4 — Evidence-based explanations

- Add observed, inferred, and unknown explanations.
- Review explanation quality against real workspace results.

## 11. Homepage claim gate

The homepage may claim:

- **“See exact cited URLs”** only after chat evidence displays clickable exact URLs.
- **“Know exactly what to improve”** only after actions include targets, rationale, evidence, and priority.
- **“See whether the action worked”** only after action-linked baseline and later-run comparisons are live.
- **“Know why a competitor won”** only when explanations are labelled by evidence strength and unknown reasons are stated honestly.

Until those acceptance criteria are met, the relevant homepage wording must be softened or marked as planned.
