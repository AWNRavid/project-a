import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIssueChangeEvents } from "./activity-diff";

const before = {
  status: "todo",
  priority: "medium",
  assigneeId: null,
  assigneeName: null,
};

test("returns no events when nothing tracked changed", () => {
  const events = buildIssueChangeEvents(before, {
    status: "todo",
    priority: "medium",
    assigneeId: null,
  });

  assert.equal(events.length, 0);
});

test("returns one status event", () => {
  const events = buildIssueChangeEvents(before, { status: "done" });

  assert.deepEqual(events, [
    { type: "status_changed", payload: { from: "todo", to: "done" } },
  ]);
});

test("returns one priority event", () => {
  const events = buildIssueChangeEvents(before, { priority: "urgent" });

  assert.deepEqual(events, [
    { type: "priority_changed", payload: { from: "medium", to: "urgent" } },
  ]);
});

test("returns an assignee event with display names", () => {
  const events = buildIssueChangeEvents(
    { ...before, assigneeId: "user-1", assigneeName: "Old Name" },
    { assigneeId: "user-2", assigneeName: "New Name" },
  );

  assert.deepEqual(events, [
    {
      type: "assignee_changed",
      payload: { from: "Old Name", to: "New Name" },
    },
  ]);
});

test("returns every changed field in a multi-field update", () => {
  const events = buildIssueChangeEvents(before, {
    status: "in_progress",
    priority: "high",
    assigneeId: "user-3",
    assigneeName: "Third Name",
  });

  assert.deepEqual(
    events.map((event) => event.type),
    ["status_changed", "priority_changed", "assignee_changed"],
  );
});
