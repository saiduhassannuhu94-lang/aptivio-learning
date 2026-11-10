-- Explicit deny policies document that these two server-only tables
-- are intentionally inaccessible to browser roles.
create policy "Answer keys are server only"
on public.quiz_answer_keys
for all
to anon, authenticated
using (false)
with check (false);

create policy "Webhook events are server only"
on public.payment_webhook_events
for all
to anon, authenticated
using (false)
with check (false);

-- Cover every new foreign key with a leading-column index.
create index payments_course_version_course_idx
  on public.payments(course_version_id, course_id);
create index quizzes_created_by_idx
  on public.quizzes(created_by);
create index quiz_attempts_enrollment_idx
  on public.quiz_attempts(enrollment_id);
create index quiz_attempts_enrollment_user_idx
  on public.quiz_attempts(enrollment_id, user_id);
create index quiz_attempts_enrollment_version_idx
  on public.quiz_attempts(enrollment_id, course_version_id);
create index quiz_attempts_quiz_version_idx
  on public.quiz_attempts(quiz_id, course_version_id);
create index quiz_attempt_answers_attempt_quiz_idx
  on public.quiz_attempt_answers(attempt_id, quiz_id);
create index quiz_attempt_answers_question_idx
  on public.quiz_attempt_answers(question_id);
create index quiz_attempt_answers_question_quiz_idx
  on public.quiz_attempt_answers(question_id, quiz_id);
