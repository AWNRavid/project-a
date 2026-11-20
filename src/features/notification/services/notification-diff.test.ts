import assert from "node:assert/strict";
import { test } from "node:test";
import { toIssueNotificationDrafts } from "./notification-diff";

test("maps status and priority changes to notifications", () => {
  const drafts = toIssueNotificationDrafts(
    [
      { type: "status_changed", payload: { from: "todo", to: "done" } },
      {
        type: "priority_changed",
        payload: { from: "low", to: "high" },
      },
    ],
    false,
  );

  assert.deepEqual(drafts, [
    { type: "status_changed", payload: { from: "todo", to: "done" } },
    { type: "priority_changed", payload: { from: "low", to: "high" } },
  ]);
});

test("notifies only when the assignee changed to someone", () => {
  const assigned = toIssueNotificationDrafts(
    [
      {
        type: "assignee_changed",
        payload: { from: "Bob", to: "Alice" },
      },
    ],
    true,
  );

  assert.deepEqual(assigned, [
    { type: "issue_assigned", payload: { from: "Bob", to: "Alice" } },
  ]);

  const unassigned = toIssueNotificationDrafts(
    [
      {
        type: "assignee_changed",
        payload: { from: "Alice", to: null },
      },
    ],
    false,
  );

  assert.deepEqual(unassigned, []);
});

test("ignores activity that is not notification-worthy", () => {
  const drafts = toIssueNotificationDrafts(
    [
      { type: "issue_created", payload: { title: "Bug" } },
      { type: "label_added", payload: { labelName: "urgent" } },
      { type: "comment_added", payload: {} },
    ],
    true,
  );

  assert.deepEqual(drafts, []);
});
