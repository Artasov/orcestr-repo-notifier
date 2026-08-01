import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const activeConfigurationFiles = [
  "action.yml",
  "README.md",
  "README.ru.md",
  "examples/technical.yml",
];

test("the action defaults to GPT-5.6 Luna with medium reasoning", () => {
  const manifest = read("action.yml");
  const modelInput = manifest.match(/^  model:\r?\n(?: {4}.+\r?\n)+/m)?.[0];
  const effortInput = manifest.match(/^  effort:\r?\n(?: {4}.+\r?\n)+/m)?.[0];

  assert.ok(modelInput, "model input is missing from action.yml");
  assert.match(modelInput, /^    default: gpt-5\.6-luna$/m);
  assert.ok(effortInput, "effort input is missing from action.yml");
  assert.match(effortInput, /^    default: medium$/m);
});

test("active documentation and examples do not restore the GPT-5.5 default", () => {
  for (const path of activeConfigurationFiles) {
    assert.doesNotMatch(read(path), /gpt-5\.5/, `${path} still references GPT-5.5`);
  }
});
