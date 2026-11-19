import assert from "node:assert/strict";
import { test } from "node:test";
import { diffIssueLabels } from "./label-diff";

const bug = { id: "1", name: "bug" };
const design = { id: "2", name: "design" };
const ops = { id: "3", name: "ops" };

test("reports labels added by the new selection", () => {
  const result = diffIssueLabels([bug], [bug, design]);

  assert.deepEqual(result.added, [design]);
  assert.deepEqual(result.removed, []);
});

test("reports labels removed by the new selection", () => {
  const result = diffIssueLabels([bug, design], [design]);

  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, [bug]);
});

test("reports multiple adds and removes", () => {
  const result = diffIssueLabels([bug, design], [design, ops]);

  assert.deepEqual(result.added, [ops]);
  assert.deepEqual(result.removed, [bug]);
});

test("reports no changes when the same labels are selected", () => {
  const result = diffIssueLabels([bug, design], [design, bug]);

  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, []);
});
