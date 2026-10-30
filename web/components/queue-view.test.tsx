import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QueueItem, QueueResponse } from "@/lib/queue";
import { QueueView } from "./queue-view";

const useSWR = vi.hoisted(() => vi.fn());

vi.mock("swr", () => ({
  default: useSWR,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const items: QueueItem[] = [
  {
    id: "run-1",
    vendor: "claude",
    label: "Add retry to webhook handler",
    status: "needs_review",
    dispatchedAt: "2026-10-30T09:00:00.000Z",
    lastUpdate: "2026-10-30T09:30:00.000Z",
    outputUrl: "https://github.com/acme/api/pull/12",
    group: "waiting",
    needsInput: true,
    repo: "acme/api",
    lastAgentMessage: "Should retries back off exponentially or use a fixed delay?",
  },
  {
    id: "run-2",
    vendor: "cursor",
    label: "Upgrade eslint config",
    status: "running",
    dispatchedAt: "2026-10-30T09:10:00.000Z",
    lastUpdate: "2026-10-30T09:20:00.000Z",
    group: "running",
    needsInput: false,
  },
];

const response: QueueResponse = {
  items,
  counts: { waiting: 1, review: 0, running: 1, failed: 0 },
};

describe("QueueView", () => {
  beforeEach(() => {
    useSWR.mockReturnValue({
      data: response,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    cleanup();
    vi.clearAllMocks();
  });

  it("renders groups in queue order with counts", () => {
    render(<QueueView />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "Waiting on you1",
      "Ready to review0· No finished work to review.",
      "Running1",
      "Failed0· No failed runs.",
    ]);
    expect(useSWR).toHaveBeenCalledWith(
      "/api/queue",
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 15000 }),
    );
  });

  it("shows the last message and actions for a waiting item", () => {
    render(<QueueView />);

    const waiting = screen.getByTestId("queue-group-waiting");
    expect(within(waiting).getByText("Add retry to webhook handler")).toBeTruthy();
    expect(within(waiting).getByText("acme/api")).toBeTruthy();
    expect(
      within(waiting).getByText("Should retries back off exponentially or use a fixed delay?"),
    ).toBeTruthy();
    expect(within(waiting).getByRole("button", { name: "Reply" })).toBeTruthy();
    expect(within(waiting).getByRole("button", { name: "Dismiss" })).toBeTruthy();
    const open = within(waiting).getByRole("link", { name: "Open" });
    expect(open.getAttribute("href")).toBe("https://github.com/acme/api/pull/12");
    expect(open.getAttribute("target")).toBe("_blank");
    expect(open.getAttribute("rel")).toContain("noopener");
  });

  it("hides Open when a run has no output link", () => {
    render(<QueueView />);

    const running = screen.getByTestId("queue-group-running");
    expect(within(running).queryByRole("link", { name: "Open" })).toBeNull();
  });

  it("shows a loading state before data arrives", () => {
    useSWR.mockReturnValue({ data: undefined, isLoading: true, mutate: vi.fn() });
    render(<QueueView />);
    expect(screen.getByText("Loading queue…")).toBeTruthy();
  });

  it("points to the dashboard when there are no runs", () => {
    useSWR.mockReturnValue({
      data: { items: [], counts: { waiting: 0, review: 0, running: 0, failed: 0 } },
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<QueueView />);
    expect(screen.getByText("No agent runs yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Agents" }).getAttribute("href")).toBe("/");
  });

  it("filters by vendor", () => {
    render(<QueueView />);

    fireEvent.click(screen.getByRole("button", { name: /Cursor/ }));
    expect(
      within(screen.getByTestId("queue-group-waiting")).queryByText("Add retry to webhook handler"),
    ).toBeNull();
    expect(
      within(screen.getByTestId("queue-group-running")).getByText("Upgrade eslint config"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Add retry to webhook handler")).toBeTruthy();
  });

  it("collapses and expands a group", () => {
    render(<QueueView />);

    const toggle = screen.getByRole("button", { name: "Collapse Waiting on you" });
    fireEvent.click(toggle);
    expect(screen.queryByText("Add retry to webhook handler")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Expand Waiting on you" }));
    expect(screen.getByText("Add retry to webhook handler")).toBeTruthy();
  });

  it("switches to the board view with one column per group", () => {
    render(<QueueView />);

    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    for (const key of ["waiting", "review", "running", "failed"]) {
      expect(screen.getByTestId(`queue-column-${key}`)).toBeTruthy();
    }
    expect(
      within(screen.getByTestId("queue-column-waiting")).getByText("Add retry to webhook handler"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("queue-column-review")).getByText("No finished work to review."),
    ).toBeTruthy();
  });
});
