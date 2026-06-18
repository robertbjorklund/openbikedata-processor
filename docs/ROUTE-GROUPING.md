# Route grouping rules

How `groupId` is assigned to bicycle route relations (`route=bicycle` in OSM).

**Goal:** Two relations share a `groupId` only when they are almost certainly fragments of the **same logical route** — not because they share a network brand or a name prefix.

**Non-goal:** `groupId` is not used for search breadth. Search may still match network names, `network=*`, or partial strings without merging map interaction.

---

## Terms

| Term | Field | Meaning |
|------|-------|---------|
| **Stage** | `stageId` | One OSM route relation (one row in our data). |
| **Logical route** | `groupId` | What the user treats as one route for highlight / stage list / download. |
| **Link key** | (internal) | String used by UnionFind to connect stages into one group. |

Pipeline order (unchanged):

1. `formatRoute` → one feature per relation, `stageId` set, `groupId = null`
2. `combineRouteSegments` → merge **connected** geometry with **identical** route tags
3. `assignRouteGroupIds` → UnionFind on **link keys** → set `groupId`

---

## Step 1 — Parse `name`

All strings are trimmed, lowercased, and whitespace-collapsed before comparison.

### 1a. Parenthetical suffix

If `name` matches `/^(.+?)\s*\(([^)]+)\)\s*$/`:

| Part | Variable |
|------|----------|
| Before `(` | `base` |
| Inside `(` `)` | `qualifier` |

Otherwise: `base = name`, `qualifier = null`.

### 1b. Classify `qualifier`

Evaluate in order (first match wins):

| Kind | Condition | Examples |
|------|-----------|----------|
| `annotation` | Exact match in **status word list** (see below) | `(planerat)`, `(planned)`, `(under construction)` |
| `stageRef` | Matches `/^(\d+[a-z]?|ev\d+)$/i` after trim | `(23)`, `(18a)`, `(EV3)` |
| `leg` | Non-empty, not `annotation`, not `stageRef` | `(Kymlingestråket)`, `(Mälardalsleden)` |
| `null` | No parenthetical | `Sverigeleden` |

**Status word list** (extend as needed; lowercase):

`planerat`, `planned`, `proposed`, `under construction`, `under konstruktion`, `construction`, `disused`, `abandoned`

When kind is `annotation`, treat as **no parenthetical** for grouping: effective name is `base` only (annotation ignored).

### 1c. Generic names

Names whose normalized form is in the generic set produce **no name-based keys** (ref rules may still apply):

`bicycle route`, `bike route`, `cycle route`, `cykelled`, `cykelväg`, `cykelbana`

---

## Step 2 — Build link keys

Let `net = network tag lowercased, or "none"`.

Helper formats (all components normalized):

```
ref:{net}:{ref}                    — ref link
name:{net}:{fullName}              — full display name, parentheses kept (except stripped annotations)
leg:{net}:{base}:{leg}             — named leg under a shared base title
```

### Rule R1 — Ref from `ref` tag

If `ref` tag is present and non-empty, let `refNorm` = normalized ref (parentheses stripped only for ref strings, same as today).

| Network | Emit |
|---------|------|
| `icn`, `ncn` | always `ref:{net}:{refNorm}` |
| `rcn`, `lcn` | see **R1b** |

**R1b — rcn / lcn ref tag**

| Situation | Emit |
|-----------|------|
| Generic or missing distinct name | `ref:{net}:{refNorm}` |
| `qualifierKind = stageRef` | `ref:{net}:{refNorm}` |
| `qualifierKind = leg` | **do not** emit ref-only key (legs are identified by name / leg key) |
| Distinct name, no leg pattern | `ref:{net}:{refNorm}:{fullName}` — composite, does not merge across different names |

### Rule R2 — Ref from parenthetical `stageRef`

If `qualifierKind = stageRef` and relation has **no** `ref` tag (or ref equals qualifier):

- Emit `ref:{net}:{qualifier}`

This links `"Sverigeleden (23)"` with `"Sverigeleden"` + `ref=23` on the same network.

### Rule R3 — Full name

If the route has a **distinct** (non-generic) effective name:

- Emit `name:{net}:{effectiveName}`

**Effective name:**

- No parenthesis, or `annotation` stripped → normalized full `name`
- `leg` → normalized **full** string including parenthesis: `"regionalt cykelnät stockholm (kymlingestråket)"`
- `stageRef` → normalized `base` only: `"sverigeleden"` (qualifier handled by R2)

**Never** emit a key that uses only `base` when `qualifierKind = leg`.

### Rule R4 — Leg identity

If `qualifierKind = leg`:

- Emit `leg:{net}:{base}:{qualifier}`

Multiple OSM relations with the same base + leg (e.g. split geometry) share this key and correctly merge.

---

## Step 3 — Assign `groupId`

Unchanged algorithm (`AssignFeatureGroupIds.ts`):

1. Collect link keys per route feature.
2. UnionFind: union indices that share **any** identical key.
3. Each connected component → one stable `groupId` hash from sorted keys in the component.

---

## Step 4 — Frontend / API

Mirror link-key semantics in `openbikemap.org` `FeatureGroupKeys.ts` for dev-mode hover without API.

When a group has **one** stage, UI behaves as a single route (no stage picker).

When a group has **multiple** stages, UI shows stage list (EuroVelo, Sverigeleden etapper).

---

## Decision matrix (examples)

| Route A | Route B | Same `groupId`? | Shared key |
|---------|---------|-----------------|------------|
| `Sverigeleden (23)`, ncn | `Sverigeleden`, ref `23`, ncn | **Yes** | `ref:ncn:23` |
| `Regionalt cykelnät X (Stråk A)`, rcn | `Regionalt cykelnät X (Stråk B)`, rcn | **No** | — |
| `Mälardalsleden`, rcn | `Mälardalsleden (planerat)`, rcn | **Yes** | `name:rcn:mälardalsleden` (annotation ignored) |
| `EuroVelo 3`, ref `EV3`, icn | `EuroVelo 3`, ref `EV3`, icn (other relation) | **Yes** | `ref:icn:ev3` |
| `Bicycle Route`, ref `18`, lcn | `Huddinge cykelnät`, ref `18`, lcn | **No** | — |
| Two relations, both `Kymlingestråket (del 2)` under same base+leg | each other | **Yes** | `leg:…` or `name:…` |

---

## Safety valve (optional, later)

If a connected component has **> 15** stages **and** every member has `qualifierKind = leg` with the **same** `base`, log a warning — possible network umbrella mis-tagged in OSM. Do not auto-split in v1.

---

## Implementation checklist

- [x] Replace `normalizeRouteName` strip-all-parens behaviour in `getRouteLinkKeys` (`RouteDisplayName.ts`)
- [x] Add `parseRouteDisplayName()` + unit tests
- [x] Update `AssignFeatureGroupIds.unit.test.ts` + `RouteLinkKeys.spec.test.ts`
- [x] Mirror rules in `openbikemap.org/src/utils/RouteDisplayName.ts` + `FeatureGroupKeys.ts`
- [ ] Regenerate regional GeoJSON + API import after processor change

---

## Related files

| File | Role |
|------|------|
| `src/transforms/RouteDisplayName.ts` | `parseRouteDisplayName`, `getRouteLinkKeys` |
| `src/transforms/FeatureMerger.ts` | Re-exports `getRouteLinkKeys` |
| `src/transforms/AssignFeatureGroupIds.ts` | UnionFind → `groupId` |
| `src/transforms/AssignFeatureGroupIds.unit.test.ts` | Regression tests |
| `src/transforms/RouteLinkKeys.spec.test.ts` | Spec tests (target behaviour) |
