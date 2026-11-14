-- Cover the question-side foreign key used when cleaning up challenge attempts.
create index if not exists brain_challenge_attempt_answers_question_idx
  on public.brain_challenge_attempt_answers(question_id);
