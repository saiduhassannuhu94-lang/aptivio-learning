-- Repair the starter challenge seed: answer keys must exist for server-side scoring.
-- Idempotent by question_id; safe to reapply without duplicating keys.
with correct_answers(slug, sort_order, correct_option_id) as (
  values
    ('logic-sequences', 1, 'c'), ('logic-sequences', 2, 'd'), ('logic-sequences', 3, 'b'), ('logic-sequences', 4, 'b'), ('logic-sequences', 5, 'a'),
    ('number-sense', 1, 'c'), ('number-sense', 2, 'b'), ('number-sense', 3, 'b'), ('number-sense', 4, 'c'), ('number-sense', 5, 'c'),
    ('word-reasoning', 1, 'b'), ('word-reasoning', 2, 'a'), ('word-reasoning', 3, 'c'), ('word-reasoning', 4, 'b'), ('word-reasoning', 5, 'a'),
    ('spatial-thinking', 1, 'c'), ('spatial-thinking', 2, 'b'), ('spatial-thinking', 3, 'b'), ('spatial-thinking', 4, 'c'), ('spatial-thinking', 5, 'b'),
    ('memory-focus', 1, 'd'), ('memory-focus', 2, 'c'), ('memory-focus', 3, 'a'), ('memory-focus', 4, 'c'), ('memory-focus', 5, 'c')
)
insert into public.brain_challenge_answer_keys (question_id, correct_option_ids)
select q.id, array[a.correct_option_id]::text[]
from correct_answers a
join public.brain_challenges c on c.slug = a.slug
join public.brain_challenge_questions q on q.challenge_id = c.id and q.sort_order = a.sort_order
on conflict (question_id) do update set correct_option_ids = excluded.correct_option_ids;
