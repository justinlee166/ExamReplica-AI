-- Phase 5: Submission and Grading tables
-- Creates submissions, submission_answers, grading_results, and error_classifications.

create table public.submissions (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    generated_exam_id uuid not null references public.generated_exams(id) on delete cascade,
    status varchar not null default 'submitted',
    total_score numeric,
    max_score numeric,
    created_at timestamp with time zone not null default now(),
    constraint submissions_status_check
        check (status in ('submitted', 'grading', 'graded', 'failed'))
);

create table public.submission_answers (
    id uuid primary key default gen_random_uuid(),
    submission_id uuid not null references public.submissions(id) on delete cascade,
    generated_question_id uuid not null references public.generated_questions(id) on delete cascade,
    student_answer text not null,
    created_at timestamp with time zone not null default now()
);

create table public.grading_results (
    id uuid primary key default gen_random_uuid(),
    submission_id uuid not null references public.submissions(id) on delete cascade,
    submission_answer_id uuid not null references public.submission_answers(id) on delete cascade,
    generated_question_id uuid not null references public.generated_questions(id) on delete cascade,
    score numeric not null default 0,
    max_score numeric not null default 1,
    is_correct boolean not null default false,
    feedback text,
    created_at timestamp with time zone not null default now()
);

create table public.error_classifications (
    id uuid primary key default gen_random_uuid(),
    grading_result_id uuid not null references public.grading_results(id) on delete cascade,
    error_type varchar not null,
    description text,
    severity varchar not null default 'minor',
    created_at timestamp with time zone not null default now(),
    constraint error_classifications_severity_check
        check (severity in ('minor', 'moderate', 'major'))
);

-- Indexes
create index idx_submissions_workspace_id on public.submissions(workspace_id);
create index idx_submissions_generated_exam_id on public.submissions(generated_exam_id);
create index idx_submission_answers_submission_id on public.submission_answers(submission_id);
create index idx_grading_results_submission_id on public.grading_results(submission_id);
create index idx_grading_results_submission_answer_id on public.grading_results(submission_answer_id);
create index idx_error_classifications_grading_result_id on public.error_classifications(grading_result_id);

-- Row-level security

alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.grading_results enable row level security;
alter table public.error_classifications enable row level security;

-- submissions: scoped to workspace owner

drop policy if exists "submissions_select_own" on public.submissions;
create policy "submissions_select_own"
on public.submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = submissions.workspace_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own"
on public.submissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = submissions.workspace_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "submissions_update_own" on public.submissions;
create policy "submissions_update_own"
on public.submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = submissions.workspace_id
      and w.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = submissions.workspace_id
      and w.user_id = auth.uid()
  )
);

-- submission_answers: scoped via parent submission's workspace owner

drop policy if exists "submission_answers_select_own" on public.submission_answers;
create policy "submission_answers_select_own"
on public.submission_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    join public.workspaces w on w.id = s.workspace_id
    where s.id = submission_answers.submission_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "submission_answers_insert_own" on public.submission_answers;
create policy "submission_answers_insert_own"
on public.submission_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.submissions s
    join public.workspaces w on w.id = s.workspace_id
    where s.id = submission_answers.submission_id
      and w.user_id = auth.uid()
  )
);

-- grading_results: scoped via parent submission's workspace owner

drop policy if exists "grading_results_select_own" on public.grading_results;
create policy "grading_results_select_own"
on public.grading_results
for select
to authenticated
using (
  exists (
    select 1
    from public.submissions s
    join public.workspaces w on w.id = s.workspace_id
    where s.id = grading_results.submission_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "grading_results_insert_own" on public.grading_results;
create policy "grading_results_insert_own"
on public.grading_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.submissions s
    join public.workspaces w on w.id = s.workspace_id
    where s.id = grading_results.submission_id
      and w.user_id = auth.uid()
  )
);

-- error_classifications: scoped via grading_result's submission's workspace owner

drop policy if exists "error_classifications_select_own" on public.error_classifications;
create policy "error_classifications_select_own"
on public.error_classifications
for select
to authenticated
using (
  exists (
    select 1
    from public.grading_results gr
    join public.submissions s on s.id = gr.submission_id
    join public.workspaces w on w.id = s.workspace_id
    where gr.id = error_classifications.grading_result_id
      and w.user_id = auth.uid()
  )
);

drop policy if exists "error_classifications_insert_own" on public.error_classifications;
create policy "error_classifications_insert_own"
on public.error_classifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.grading_results gr
    join public.submissions s on s.id = gr.submission_id
    join public.workspaces w on w.id = s.workspace_id
    where gr.id = error_classifications.grading_result_id
      and w.user_id = auth.uid()
  )
);
