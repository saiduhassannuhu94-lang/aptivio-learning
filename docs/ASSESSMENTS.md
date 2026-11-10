# APTIVIO Assessment Foundation

**Status:** Backend foundation and server APIs implemented; admin authoring UI and learner assessment player remain pending.

## Supported question types

- Single choice
- Multiple choice
- True/false

Every question has an ordered option list and a separate answer-key row. Answer keys are stored in `quiz_answer_keys`, which has RLS enabled and no browser-role table grants. The learner-facing question query returns prompts and options only.

## Access rules

- A quiz belongs to one immutable course version.
- Only published quizzes are available to learners.
- Learners must have an active or completed enrolment for that exact course version.
- Attempt creation is performed by a server-only RPC. It validates the enrolment, serializes concurrent starts by locking the quiz row, prevents multiple in-progress attempts, and enforces the configured attempt limit.
- Attempt and answer rows are read-only to browser roles.
- A quiz is frozen on first publication. Unpublishing hides it but does not unlock its questions or answer keys; changes require a new quiz record so active and historical attempts cannot be silently regraded.
- The server loads answer keys and grades submissions. The browser never submits a score or pass/fail value.
- The submission RPC locks the attempt, checks its state, verifies answer/question relationships and score totals, stores answers, and records the final grade atomically.
- Repeated submissions are rejected.
- Time limits are checked server-side when a learner submits.

## Scoring

Scoring is deterministic and exact-match:

- Single-choice and true/false require the correct single option.
- Multiple-choice requires the complete correct set. Partial credit is not awarded.
- Unanswered questions receive zero points.
- The pass result is calculated from the quiz's stored pass mark.

## API routes

- `GET /api/quizzes/{quizId}/attempts` checks access and returns the current in-progress attempt, if one exists, plus questions without answer keys.
- `POST /api/quizzes/{quizId}/attempts` starts an attempt and returns questions without answer keys.
- `POST /api/quizzes/attempts/{attemptId}/submit` validates, grades, and submits answers.

## Remaining work

- Admin quiz authoring and review interface.
- Learner quiz-taking interface with timer, answer autosave, and a polished resume experience. The API can find an active attempt, but responses are not autosaved yet.
- Rich feedback and question explanations.
- Application-level integration tests with separate learner accounts.
- Decide whether to support manual grading or additional question types.

No certificate or accreditation is implied by a quiz result.
