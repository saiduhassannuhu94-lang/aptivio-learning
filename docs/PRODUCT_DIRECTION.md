# APTIVIO product direction

## Product definition

APTIVIO is a student learning and cognitive-practice platform. It is **not** an online school, accredited course provider, LMS clone, or certification marketplace.

Its job is to give students one place to:
- learn useful concepts through accessible, self-paced material;
- practise with exercises and knowledge checks;
- take IQ-style reasoning and aptitude challenges;
- understand performance by skill area;
- track improvement over time.

## Product pillars

### 1. Learn
A searchable learning library with concise lessons, explainers, examples, exercises and references. Content is organised by subject and topic for discovery, not by formal academic enrolment.

### 2. Test and challenge
An independent challenge area covering logical reasoning, abstract patterns, numerical reasoning, verbal reasoning, spatial reasoning, memory and problem-solving. Challenges need clear instructions, difficulty, time limits where appropriate, accessible controls and reliable scoring.

### 3. Understand results
Every completed challenge should show score, accuracy, time used, skill-area breakdown and explanations where appropriate. A learner should be able to review past attempts and compare progress with their own history.

### 4. Improve
Offer practice recommendations based on missed question types, daily challenges and repeat practice. Avoid manipulative streak mechanics or leaderboards that reward cheating.

## Important measurement rule

APTIVIO may offer **IQ-style practice and reasoning assessments**, but must not present an unvalidated quiz score as a clinically or scientifically established IQ score. Any IQ estimate requires a properly validated, norm-referenced assessment and careful explanation of its limits. Until that exists, label results as reasoning or challenge scores.

## What APTIVIO is not trying to build

- No mandatory course enrolment as the centre of the product.
- No certificates or claims of accreditation.
- No payment wall for basic learning or practice during the current build.
- No fake course counts, demo scores or invented leaderboard entries.
- No publishing content as scientifically validated without evidence.

## Product navigation target

- Home
- Learn (browse/search topics and lessons)
- Challenges (browse and start reasoning tests)
- My progress (learning history, attempts, strengths and practice areas)
- Account

## Existing implementation to reuse carefully

The repository already contains a learning catalogue, lesson access, progress tracking, quiz-attempt workflows and assessment grading. Reuse suitable components, but decouple independent reasoning challenges from course-version enrolment. A student should be able to take a standalone challenge without first enrolling in a course.

## Definition of a usable first release

1. Visitors can browse learning topics and challenge categories.
2. Signed-in students can open lessons and take independent challenges.
3. Challenge questions and answer keys are stored separately; answer keys never reach the browser.
4. Attempts are timed and scored server-side, with expiry and duplicate-submit protection.
5. Results show score, accuracy, elapsed time and skill breakdown.
6. Students can review their own history and improvement.
7. No fabricated IQ number, accreditation, score norm or public ranking.
8. Mobile-first, accessible, low-bandwidth experience.

## Current scope decision

The existing 20 course packages may be repurposed as structured learning-library content. They are not a requirement to imitate a formal online school, and their count must never be used as a proxy for product completeness.
