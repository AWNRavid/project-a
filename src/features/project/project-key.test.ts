import assert from "node:assert/strict";
import { test } from "node:test";
import { projectKey } from "./project-key";

test("projectKey keeps the first three alphanumerics and a 4-char suffix", () => {
  assert.match(projectKey("Mobile App"), /^MOB-[0-9A-Z]{4}$/);
});

test("projectKey pads short or non-alphanumeric titles with X", () => {
  assert.match(projectKey("ab"), /^ABX-[0-9A-Z]{4}$/);
  assert.match(projectKey("///"), /^XXX-[0-9A-Z]{4}$/);
});
