# API Surface Reference

Endpoint-by-endpoint map of `SudojoClient` methods, React Query hooks, gating, cache
times, and query keys. Source of truth: `src/network/sudojo-client.ts` (`createApiConfig`
→ `ENDPOINTS`), `src/hooks/*.ts`, `src/solver/hooks/*.ts`. Routes are served by
`sudojo_api` (`src/routes/*.ts`, mounted at `/api/v1`).

All hooks take `(networkClient: NetworkClient, baseUrl: string, ...)` as their first two
arguments (omitted below). Query hooks end with an optional `options` object
(`UseQueryOptions` minus `queryKey`/`queryFn`); mutation hooks take no further arguments
and are called as `mutate({ token, ... })`. Every client method returns
`Promise<BaseResponse<T>>` (`{ success, data?, error?, timestamp }` from `@sudobility/sudojo_types`).

## Query hooks

"Enabled when" is ANDed with `options.enabled` (default `true`). Keys are shown without
the `queryKeys.sudojo.` / `solverQueryKeys.` prefix.

| Hook (args after baseUrl) | Client method → endpoint | Enabled when | staleTime | Query key |
|---|---|---|---|---|
| `useSudojoHealth()` | `getHealth()` → `GET /` | always (`options.enabled` passes through) | `HEALTH_STATUS` 1m | `health()` |
| `useSudojoLevels(token)` | `getLevels` → `GET /api/v1/levels` | always | `LEVELS` 10m | `levels()` |
| `useSudojoLevel(token, level)` | `getLevel` → `GET /api/v1/levels/:level` | `1 <= level <= 12` | 10m | `level(n)` |
| `useSudojoTechniques(token, {level}?)` | `getTechniques` → `GET /api/v1/techniques?level=` | always | `TECHNIQUES` 10m | `techniques({level})` |
| `useSudojoTechnique(token, technique)` | `getTechnique` → `GET /api/v1/techniques/:technique` | `technique >= 1` | 10m | `technique(n)` |
| `useSudojoLearning(token, {technique, language_code}?)` | `getLearning` → `GET /api/v1/learning` | always | `LEARNING` 10m | `learning({...})` |
| `useSudojoLearningItem(token, uuid)` | `getLearningItem` → `GET /api/v1/learning/:uuid` | `uuid` truthy | 10m | `learningItem(uuid)` |
| `useSudojoBoards(token, {level}?)` | `getBoards` → `GET /api/v1/boards` | always | `BOARDS` 5m | `boards({level})` |
| `useSudojoRandomBoard(token, {level}?)` | `getRandomBoard` → `GET /api/v1/boards/random` | always | `Infinity`, no refetch on focus | `boardRandom({level})` |
| `useSudojoBoard(token, uuid)` | `getBoard` → `GET /api/v1/boards/:uuid` | `uuid` truthy | 5m | `board(uuid)` |
| `useSudojoDailies(token)` | `getDailies` → `GET /api/v1/dailies` | always | `DAILIES` 5m | `dailies()` |
| `useSudojoTodayDaily(token)` | `getTodayDaily` → `GET /api/v1/dailies/today` | always | 5m | `dailyToday()` |
| `useSudojoDailyByDate(token, date)` | `getDailyByDate` → `GET /api/v1/dailies/date/:date` | `date` truthy | 5m | `dailyByDate(date)` |
| `useSudojoDaily(token, uuid)` | `getDaily` → `GET /api/v1/dailies/:uuid` | `uuid` truthy | 5m | `daily(uuid)` |
| `useSudojoChallenges(token, {level, difficulty}?)` | `getChallenges` → `GET /api/v1/challenges` | always | `CHALLENGES` 5m | `challenges({...})` |
| `useSudojoRandomChallenge(token, {level, difficulty}?)` | `getRandomChallenge` → `GET /api/v1/challenges/random` | always | `0` | `challengeRandom({...})` |
| `useSudojoChallenge(token, uuid)` | `getChallenge` → `GET /api/v1/challenges/:uuid` | `uuid` truthy | 5m | `challenge(uuid)` |
| `useSudojoUser(token, userId)` | `getUser` → `GET /api/v1/users/:userId` | `token && userId` | `USER` 5m, no refetch on focus | `user(userId)` |
| `useSudojoUserSubscription(token, userId, testMode?)` | `getUserSubscription` → `GET /api/v1/users/:userId/subscriptions[?testMode=true]` | `token && userId` | `USER_SUBSCRIPTION` 2m | `userSubscription(userId)` (no `testMode`) |
| `useSudojoPracticeCounts(token)` | `getPracticeCounts` → `GET /api/v1/practices/counts` | always | `0` | `practiceCounts()` |
| `useSudojoRandomPractice(token, technique)` | `getRandomPractice` → `GET /api/v1/practices/technique/:technique/random` | `technique >= 1` | `0` | `practiceRandom(n)` |
| `useSudojoCommunities(token, {language}?)` | `getCommunities` → `GET /api/v1/communities` | always | `COMMUNITIES` 10m | `communities({language})` |
| `useSudojoStrategies(token)` | `getStrategies` → `GET /api/v1/strategies` | always | `STRATEGIES` 10m | `strategies()` |
| `useSudojoStrategyByStub(token, stub)` | `getStrategyByStub` → `GET /api/v1/strategies/stub/:stub` | `stub` truthy | 10m | `strategyByStub(stub)` |
| `useSudojoGamificationStats(token)` | `getGamificationStats` → `GET /api/v1/gamification/stats` | `token` | 2m (`USER_SUBSCRIPTION`) | `gamificationStats()` |
| `useSudojoBadgeDefinitions()` | `getBadgeDefinitions()` → `GET /api/v1/gamification/badges` | always | 10m (`LEVELS`) | `gamificationBadges()` |
| `useSudojoPointHistory(token, {limit, offset}?)` | `getPointHistory` → `GET /api/v1/gamification/history` | `token` | `0` | `gamificationHistory({...})` |
| `useSolverSolve(token, SolveOptions)` | `solverSolve` → `GET /api/v1/solver/solve` | `token` | `SOLVER_STALE_TIMES.SOLVE` 1m | `solve({...})` |
| `useSolverValidate(token, {original})` | `solverValidate` → `GET /api/v1/solver/validate` | always (no token needed) | `VALIDATE` 10m | `validate(original)` |
| `useSolverGenerate(token, {symmetrical}?)` | `solverGenerate` → `GET /api/v1/solver/generate` | `token` | `GENERATE` 0 | `generate({symmetrical})` |

## Mutation hooks

| Hook | `mutate` variables | Client method → endpoint | On success |
|---|---|---|---|
| `useSudojoCreateLevel` | `{token, data}` | `createLevel` → `POST /api/v1/levels` | invalidate `levels()` |
| `useSudojoUpdateLevel` | `{token, level, data}` | `updateLevel` → `PUT /api/v1/levels/:level` | invalidate `levels()`, `level(n)` |
| `useSudojoDeleteLevel` | `{token, level}` | `deleteLevel` → `DELETE /api/v1/levels/:level` | invalidate `levels()`, remove `level(n)` |
| `useSudojo{Create,Update,Delete}Technique` | `{token, data}` / `{token, technique, data}` / `{token, technique}` | `…Technique` → `/api/v1/techniques[/:technique]` | invalidate `["sudojo","techniques"]`; update also `technique(n)`, delete removes it |
| `useSudojo{Create,Update,Delete}Learning` | `{token, data}` / `{token, uuid, data}` / `{token, uuid}` | `…Learning` → `/api/v1/learning[/:uuid]` | invalidate `["sudojo","learning"]`; update also item, delete removes it |
| `useSudojo{Create,Update,Delete}Board` | same shape (uuid) | `…Board` → `/api/v1/boards[/:uuid]` | invalidate `["sudojo","boards"]`; update also `board(uuid)`, delete removes it |
| `useSudojo{Create,Update,Delete}Daily` | same shape (uuid) | `…Daily` → `/api/v1/dailies[/:uuid]` | invalidate `["sudojo","dailies"]`; update also `daily(uuid)`, delete removes it |
| `useSudojo{Create,Update,Delete}Challenge` | same shape (uuid) | `…Challenge` → `/api/v1/challenges[/:uuid]` | invalidate `["sudojo","challenges"]`; update also item, delete removes it |
| `useSudojo{Create,Update,Delete}Community` | same shape (uuid) | `…Community` → `/api/v1/communities[/:uuid]` | invalidate `["sudojo","communities"]` |
| `useSudojo{Create,Update,Delete}Strategy` | `{token, data}` / `{token, strategy, data}` / `{token, strategy}` | `…Strategy` → `/api/v1/strategies[/:strategy]` | invalidate `["sudojo","strategies"]` |
| `useSudojoCreatePractice` | `{token, data}` | `createPractice` → `POST /api/v1/practices` | invalidate `practiceCounts()` |
| `useSudojoDeleteAllPractices` | `{token}` | `deleteAllPractices` → `DELETE /api/v1/practices?confirm=true` | invalidate `practiceCounts()` |
| `useSudojoRegeneratePracticeHints` | `{token}` | `regeneratePracticeHints` → `POST /api/v1/practices/regenerate-hints` (600 s timeout) | none |
| `useSudojoPlayStart` | `{token, data}` | `playStart` → `POST /api/v1/play/start` | none |
| `useSudojoPlayFinish` | `{token, data}` | `playFinish` → `POST /api/v1/play/finish` | invalidate `gamificationStats()`, `["sudojo","gamification","history"]` |

`useSudojoInvalidation()` returns `invalidateAll`, `invalidateLevels`, `invalidateTechniques`,
`invalidateLearning`, `invalidateBoards`, `invalidateDailies`, `invalidateChallenges`,
`invalidateUsers`, `invalidatePractices`, `invalidateGamification`. Each invalidates the
`["sudojo", <resource>]` prefix. There are no helpers for communities or strategies.

## Client-only methods (no hook)

| Method | Endpoint |
|---|---|
| `getCommunity(token, uuid)` | `GET /api/v1/communities/:uuid` |
| `getStrategy(token, strategy)` | `GET /api/v1/strategies/:strategy` |
| `getExampleCounts(token)` | `GET /api/v1/examples/counts` |
| `getExamples(token, {technique}?)` | `GET /api/v1/examples` |
| `createExample(token, data)` | `POST /api/v1/examples` |
| `getBoardCounts(token)` | `GET /api/v1/boards/counts` |
| `getBoardCountsByTechnique(token)` | `GET /api/v1/boards/counts/by-technique` |
| `updatePuzzleStats(token)` | `POST /api/v1/boards/update-stats` |

`sudojo_api` routes with no client method: `POST /api/v1/ocr/extract`,
`GET /api/v1/techniques/path/:path`, `GET /api/v1/examples/random`,
`GET|PUT|DELETE /api/v1/examples/:uuid`, `GET|DELETE /api/v1/practices/:uuid`,
`POST|PUT|DELETE /api/v1/gamification/badges[/:badgeKey]`, `DELETE /api/v1/users/:userId`.

## Request details

**Query parameters sent by the client**

| Method | Params |
|---|---|
| `getBoards` | `level`, `limit`, `offset`, `techniques`, `technique_bit` (bitmasks, sent losslessly; see [Technique bitmasks](#technique-bitmasks)). `useSudojoBoards` forwards only `level` |
| `getRandomBoard` | `level`, `symmetrical`. `useSudojoRandomBoard` forwards only `level` |
| `getChallenges` / `getRandomChallenge` | `level`, `difficulty` |
| `getLearning` | `technique`, `language_code` |
| `getTechniques` | `level` |
| `getCommunities` | `language` |
| `getExamples` | `technique` |
| `getPointHistory` | `limit`, `offset` (omitted when `0`/falsy) |
| `solverSolve` | `autopencilmarks`, `filters`, `original`, `pencilmarks`, `techniques`, `user` (keys sorted alphabetically, `undefined` dropped, commas left unencoded). Here `techniques` is a comma-separated technique-ID list (`"1,2,60"`), not a bitmask |
| `solverValidate` | `original` |
| `solverGenerate` | `symmetrical` |

**Validation thrown before any request** (`Error`, not a network call):

| Rule | Methods |
|---|---|
| `level` must be 1–12 | `getLevel`, `updateLevel`, `deleteLevel` |
| `technique >= 1` | `getTechnique`, `updateTechnique`, `deleteTechnique`, `getRandomPractice` |
| `strategy >= 1` | `getStrategy`, `updateStrategy`, `deleteStrategy` |
| valid UUID (`validateUUID` from sudojo_types) | learning, board, daily, challenge, community `:uuid` methods |
| `date` matches `YYYY-MM-DD` | `getDailyByDate` |
| `userId` 1–128 chars | `getUser`, `getUserSubscription` |

**Timeouts:** `solverSolve` and `solverValidate` use 120 s, and `regeneratePracticeHints` uses 600 s.
All other calls use the `NetworkClient` default.

## Technique bitmasks

Bit N = technique id N (ids 1–60). A mask with any id ≥ 54 does not fit in a JS number, so
`Number("1152921504606846978")` (technique 60 + technique 1) silently loses technique 1.
Treat masks as **base-10 strings** on the wire and as `bigint` in code.

| Direction | Fields | What the client does | What callers should do |
|---|---|---|---|
| Response | `techniques_bitmask` (boards, dailies, solver validate/generate), `techniques_bitfield_bitmask` (examples), next to the lossy numeric `techniques` / `techniques_bitfield` | Returns them unchanged | Read `techniqueBitmaskOf(obj)` (`bigint`), then `hasTechniqueInBitmask` / `techniqueIdsFromBitmask`. Don't branch on the numeric field |
| Query | `getBoards` `techniques`, `technique_bit` | Sends strings and bigints exactly. Integer numbers go through `BigInt(n)`, because `String(2 ** 60)` is `"1152921504606847000"` (2^60 + 24), which the API would read as techniques 60, 4 and 3 | Pass `formatTechniqueBitmask(mask)`. A number is still lossy for ids ≥ 54 |
| Body | `techniques` (create/update board and daily), `techniques_bitfield` (`createExample`) | `JSON.stringify` with a replacer that writes a `bigint` as its decimal string | Pass `formatTechniqueBitmask(mask)`. A number is accepted but lossy for ids ≥ 54 |
| Query key | none today | n/a | React Query hashes keys with `JSON.stringify`, which throws on `bigint`, and numbers beyond 2^53 collide. Put masks in keys as strings |

`sudojo_api` accepts a number or a decimal string for every bitmask input and returns 400 for
invalid values (negative, non-integer, `""`, signs, hex, exponent).

> **Pending sudojo_types release.** The `*_bitmask` response fields, the widened
> `number | string` request types, and the helpers named above live only in the local, unpublished
> `../sudojo_types/src/index.ts`. The installed `@sudobility/sudojo_types` 1.2.61 still types these
> fields as `number`. The client's runtime already passes strings through, and `src/` imports none
> of the new helpers, so it builds against both versions. Import the helpers from
> `@sudobility/sudojo_types` in apps once it is released.

## Errors and responses

- `request()` throws `Error("No data received from server")` when `response.data === undefined`.
  It does **not** check `response.ok`: a non-2xx response with a JSON body resolves as data unless
  the `NetworkClient` implementation throws.
- `solverSolve` bypasses `request()`. On `status === 402` with `error.code === "HINT_ACCESS_DENIED"`
  it throws `HintAccessDeniedError` (`hintLevel`, `requiredEntitlement`, `userState`). On any other
  `!ok` it throws `Error("Failed to get hints from solver")`.
- Every response body, solver responses included, goes through `decryptSolutionFields`. Any `solution`
  string starting with `enc:` is AES-GCM-decrypted once `configureSolutionKey(hex)` has been called.
  The format is `enc:` + base64(12-byte nonce ‖ ciphertext ‖ tag), which matches
  `sudojo_api/src/lib/solution-crypto.ts`.
