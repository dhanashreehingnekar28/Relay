import { initialState } from "../domain/engine";
import type { State } from "../domain/types";
export const STORAGE_KEY = "relay-concept-v1";
type ObjectValue = Record<string, unknown>;
const object = (v: unknown): v is ObjectValue =>
  !!v && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const fields = (v: ObjectValue, names: string[]) =>
  names.every((n) => typeof v[n] === "string");
const claim = (v: unknown) =>
  object(v) &&
  fields(v, [
    "id",
    "statement",
    "category",
    "owner",
    "evidence",
    "review",
    "explanation",
    "note",
    "resolution",
    "updated",
  ]) &&
  strings(v.refs) &&
  typeof v.restricted === "boolean";
const record = (v: unknown) =>
  object(v) &&
  fields(v, [
    "id",
    "title",
    "type",
    "author",
    "timestamp",
    "reference",
    "access",
    "content",
  ]) &&
  strings(v.entities);
const version = (v: unknown) =>
  object(v) &&
  typeof v.id === "number" &&
  fields(v, ["at", "audience", "author", "departing", "incoming"]) &&
  Array.isArray(v.claims) &&
  v.claims.every(claim) &&
  Array.isArray(v.records) &&
  v.records.every(record);
const event = (v: unknown) =>
  object(v) && fields(v, ["id", "type", "detail", "at", "actor"]);
const review = (v: unknown) =>
  object(v) &&
  fields(v, ["id", "claimId", "actor", "at", "reason"]) &&
  claim(v.before) &&
  claim(v.after);
function project(v: unknown) {
  return (
    object(v) &&
    strings(v.connections) &&
    v.connections.every((s) =>
      ["github", "notes", "board", "chat"].includes(s),
    ) &&
    typeof v.restrictedEnabled === "boolean" &&
    typeof v.run === "number" &&
    typeof v.dirty === "boolean" &&
    fields(v, ["departing", "incoming"]) &&
    Array.isArray(v.claims) &&
    v.claims.every(claim) &&
    Array.isArray(v.events) &&
    v.events.every(event) &&
    Array.isArray(v.reviews) &&
    v.reviews.every(review) &&
    Array.isArray(v.versions) &&
    v.versions.every(version) &&
    strings(v.resolvedGaps) &&
    object(v.tasks) &&
    Object.values(v.tasks).every(
      (t) =>
        object(t) && typeof t.done === "boolean" && typeof t.note === "string",
    )
  );
}
export function parseState(raw: string | null): State {
  try {
    if (!raw) return initialState();
    const s: unknown = JSON.parse(raw);
    if (
      !object(s) ||
      s.schema !== 1 ||
      !["reviewer", "incoming", "departing"].includes(String(s.role)) ||
      !["campus", "practice"].includes(String(s.projectId)) ||
      !object(s.projects) ||
      !project(s.projects.campus) ||
      !project(s.projects.practice)
    )
      return initialState();
    return s as unknown as State;
  } catch {
    return initialState();
  }
}
