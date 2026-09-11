import { describe, expect, it } from "vitest";

import { dateTimestamp, newestNews, splitEvents } from "@/routes/collection-dates";

describe("collection date edge cases", () => {
  it("interprets date-only leap days as UTC midnight and resolves offsets across dates", () => {
    expect(dateTimestamp("2028-02-29")).toBe(Date.UTC(2028, 1, 29));
    expect(dateTimestamp("2026-09-09T00:30:00+02:00")).toBe(Date.UTC(2026, 8, 8, 22, 30));
    expect(dateTimestamp("2026-09-08T23:30:00-02:00")).toBe(Date.UTC(2026, 8, 9, 1, 30));
  });

  it("orders news by instant with slug tie breaks, preserving frozen input and record identity", () => {
    const oldest = Object.freeze({ slug: "oldest", publishedAt: "2026-09-09T00:30:00+02:00" });
    const zulu = Object.freeze({ slug: "zulu", publishedAt: "2026-09-09T00:00:00Z" });
    const alpha = Object.freeze({ slug: "alpha", publishedAt: "2026-09-09" });
    const newest = Object.freeze({ slug: "newest", publishedAt: "2026-09-08T23:30:00-02:00" });
    const records = Object.freeze([oldest, zulu, newest, alpha]);
    const ordered = newestNews(records);
    expect(ordered.map((item) => item.slug)).toEqual(["newest", "alpha", "zulu", "oldest"]);
    expect(records).toEqual([oldest, zulu, newest, alpha]);
    expect(ordered).not.toBe(records);
    expect(ordered[0]).toBe(newest);
    expect(ordered[1]).toBe(alpha);
  });

  it.each([
    ["2026-09-09T23:59:59.999Z", "upcoming"],
    ["2026-09-10T00:00:00Z", "past"],
    ["2026-09-10T00:00:00.001Z", "past"],
    ["2026-09-10T01:00:00+02:00", "upcoming"],
    ["2026-09-09T23:00:00-02:00", "past"],
  ] as const)("classifies all-day end boundaries at %s as %s", (asOf, group) => {
    const singleDay = { slug: "single-day", startsAt: "2026-09-09" };
    const multiDay = { slug: "multi-day", startsAt: "2026-09-07", endsAt: "2026-09-09" };
    const groups = splitEvents([singleDay, multiDay], asOf);
    expect(groups[group]).toHaveLength(2);
    expect(groups[group]).toContain(singleDay);
    expect(groups[group]).toContain(multiDay);
    expect(groups[group === "past" ? "upcoming" : "past"]).toEqual([]);
  });

  it.each([
    ["2026-09-09T11:59:59.999Z", "upcoming"],
    ["2026-09-09T12:00:00Z", "upcoming"],
    ["2026-09-09T12:00:00.001Z", "past"],
  ] as const)("classifies timed end boundaries at %s as %s", (asOf, group) => {
    const point = { slug: "point", startsAt: "2026-09-09T14:00:00+02:00" };
    const range = {
      slug: "range",
      startsAt: "2026-09-08T10:00:00Z",
      endsAt: "2026-09-09T08:00:00-04:00",
    };
    const groups = splitEvents([point, range], asOf);
    expect(groups[group]).toHaveLength(2);
    expect(groups[group]).toContain(point);
    expect(groups[group]).toContain(range);
    expect(groups[group === "past" ? "upcoming" : "past"]).toEqual([]);
  });

  it("sorts each event group by UTC start with slug ties without mutating frozen records", () => {
    const records = Object.freeze(
      [
        { slug: "future-z", startsAt: "2026-09-11T01:00:00+02:00" },
        { slug: "old", startsAt: "2026-09-08T01:00:00+02:00" },
        { slug: "recent-z", startsAt: "2026-09-08T23:00:00Z" },
        { slug: "future-a", startsAt: "2026-09-10T23:00:00Z" },
        { slug: "recent-a", startsAt: "2026-09-09T01:00:00+02:00" },
        { slug: "sooner", startsAt: "2026-09-10T22:00:00Z" },
        { slug: "ongoing", startsAt: "2026-09-07", endsAt: "2026-09-10" },
      ].map((event) => Object.freeze(event)),
    );
    const before = structuredClone(records);
    const { upcoming, past } = splitEvents(records, "2026-09-09T12:00:00Z");
    expect(upcoming.map((event) => event.slug)).toEqual([
      "ongoing",
      "sooner",
      "future-a",
      "future-z",
    ]);
    expect(past.map((event) => event.slug)).toEqual(["recent-a", "recent-z", "old"]);
    expect(records).toEqual(before);
    const all = [...upcoming, ...past];
    expect(all).toHaveLength(records.length);
    expect(new Set(all).size).toBe(records.length);
    for (const event of records) expect(all).toContain(event);
  });

  it("returns independent empty collections and still rejects an invalid reference date", () => {
    const empty = Object.freeze([]);
    const ordered = newestNews(empty);
    const { upcoming, past } = splitEvents(empty, "2026-09-09T00:00:00Z");
    expect(ordered).toEqual([]);
    expect(ordered).not.toBe(empty);
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
    expect(upcoming).not.toBe(past);
    expect(upcoming).not.toBe(empty);
    expect(past).not.toBe(empty);
    expect(() => splitEvents(empty, "not-a-date")).toThrow(/Invalid collection date/);
  });
});
