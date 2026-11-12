import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { POST } from "./route";

type QueryResult = { data: unknown; error?: { code?: string; message?: string } | null };

function makeSupabase(options?: {
  user?: { id: string } | null;
  lesson?: QueryResult;
  section?: QueryResult;
  version?: QueryResult;
  enrollment?: QueryResult;
  existingProgress?: QueryResult;
  upsertError?: { code?: string; message?: string } | null;
}) {
  const values: Record<string, QueryResult> = {
    lessons: options?.lesson ?? { data: { id: "11111111-1111-4111-8111-111111111111", section_id: "section-1", duration_seconds: 90 } },
    course_sections: options?.section ?? { data: { course_version_id: "version-1" } },
    course_versions: options?.version ?? { data: { course_id: "course-1" } },
    enrollments: options?.enrollment ?? { data: { id: "enrollment-1" } },
    lesson_progress: options?.existingProgress ?? { data: null },
  };

  const upsert = vi.fn().mockResolvedValue({ error: options?.upsertError ?? null });
  const from = vi.fn((table: string) => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => values[table] ?? { data: null }),
      upsert,
    };
    return builder;
  });

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: options?.user === undefined ? { id: "learner-1" } : options.user },
          error: null,
        }),
      },
      from,
    },
    from,
    upsert,
  };
}

function request(body: unknown) {
  return new Request("https://aptivio.test/api/learning/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validInput = {
  lessonId: "11111111-1111-4111-8111-111111111111",
  completed: false,
  positionSeconds: 120,
};

describe("POST /api/learning/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects anonymous requests before querying learning data", async () => {
    const supabase = makeSupabase({ user: null });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(request(validInput));

    expect(response.status).toBe(401);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects malformed lesson progress input", async () => {
    const supabase = makeSupabase();
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(request({ lessonId: "not-a-uuid", positionSeconds: -1 }));

    expect(response.status).toBe(400);
    expect(supabase.upsert).not.toHaveBeenCalled();
  });

  it("does not write progress for a lesson hidden by RLS or not found", async () => {
    const supabase = makeSupabase({ lesson: { data: null } });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(request(validInput));

    expect(response.status).toBe(404);
    expect(supabase.upsert).not.toHaveBeenCalled();
  });

  it("requires an active enrollment for the exact course version", async () => {
    const supabase = makeSupabase({ enrollment: { data: null } });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(request(validInput));

    expect(response.status).toBe(403);
    expect(supabase.upsert).not.toHaveBeenCalled();
  });

  it("clamps playback position and preserves an existing completion", async () => {
    const completedAt = "2026-11-01T10:00:00.000Z";
    const supabase = makeSupabase({
      existingProgress: {
        data: { is_completed: true, completed_at: completedAt },
      },
    });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(request(validInput));
    const payload = supabase.upsert.mock.calls[0]?.[0];

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ saved: true });
    expect(payload).toMatchObject({
      enrollment_id: "enrollment-1",
      lesson_id: validInput.lessonId,
      user_id: "learner-1",
      last_position_seconds: 90,
      is_completed: true,
      completed_at: completedAt,
    });
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.any(Object),
      { onConflict: "enrollment_id,lesson_id" },
    );
  });

  it("returns a server error when the database refuses the progress write", async () => {
    const supabase = makeSupabase({
      upsertError: { code: "XX000", message: "write failed" },
    });
    createClientMock.mockResolvedValue(supabase.client);

    const response = await POST(request(validInput));

    expect(response.status).toBe(500);
    expect(supabase.upsert).toHaveBeenCalledOnce();
  });
});
