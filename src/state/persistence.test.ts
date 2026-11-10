import { it, expect } from "vitest";
import { parseState } from "./persistence";
import { initialState, reducer } from "../domain/engine";
it("restores a valid demo and rejects malformed nested state", () => {
  let s = reducer(initialState(), { type: "connect", source: "github" });
  s = reducer(s, { type: "reconstruct" });
  expect(parseState(JSON.stringify(s))).toEqual(s);
  expect(parseState("{bad")).toEqual(initialState());
  expect(
    parseState(
      JSON.stringify({
        ...s,
        projects: {
          campus: { ...s.projects.campus, tasks: null },
          practice: s.projects.practice,
        },
      }),
    ),
  ).toEqual(initialState());
  expect(
    parseState(
      JSON.stringify({
        ...s,
        projects: {
          ...s.projects,
          campus: { ...s.projects.campus, claims: [{ statement: 25 }] },
        },
      }),
    ),
  ).toEqual(initialState());
});
