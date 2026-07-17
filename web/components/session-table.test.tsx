import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionView } from "@/lib/view";
import { SessionTable } from "./session-table";

const useSWR = vi.hoisted(() => vi.fn());

vi.mock("swr", () => ({
  default: useSWR,
}));

const sessions: SessionView[] = [
  {
    id: "session-1",
    vendor: "claude",
    label: "Fix keyboard flow",
    status: "running",
    dispatchedAt: "2026-07-16T10:00:00.000Z",
    lastUpdate: "2026-07-16T10:05:00.000Z",
  },
  {
    id: "session-2",
    vendor: "jules",
    label: "Review accessibility",
    status: "needs_review",
    dispatchedAt: "2026-07-16T11:00:00.000Z",
    lastUpdate: "2026-07-16T11:05:00.000Z",
  },
];

function rowFor(label: string): HTMLTableRowElement {
  const row = screen.getByText(label).closest("tr");
  expect(row).not.toBeNull();
  return row as HTMLTableRowElement;
}

describe("SessionTable row activation", () => {
  beforeEach(() => {
    useSWR.mockReturnValue({
      data: { sessions },
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("makes every session row keyboard focusable", () => {
    render(<SessionTable onSelect={vi.fn()} />);

    expect(rowFor("Fix keyboard flow").tabIndex).toBe(0);
    expect(rowFor("Review accessibility").tabIndex).toBe(0);
  });

  it("selects the clicked session", () => {
    const onSelect = vi.fn();
    render(<SessionTable onSelect={onSelect} />);

    fireEvent.click(rowFor("Fix keyboard flow"));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(sessions[0]);
  });

  it("selects the focused session when Enter is pressed", () => {
    const onSelect = vi.fn();
    render(<SessionTable onSelect={onSelect} />);

    fireEvent.keyDown(rowFor("Review accessibility"), { key: "Enter" });

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(sessions[1]);
  });

  it("selects the focused session and prevents scrolling when Space is pressed", () => {
    const onSelect = vi.fn();
    render(<SessionTable onSelect={onSelect} />);
    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });

    const dispatched = rowFor("Fix keyboard flow").dispatchEvent(event);

    expect(dispatched).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(sessions[0]);
  });

  it("ignores keys that do not activate a row", () => {
    const onSelect = vi.fn();
    render(<SessionTable onSelect={onSelect} />);

    fireEvent.keyDown(rowFor("Fix keyboard flow"), { key: "ArrowDown" });

    expect(onSelect).not.toHaveBeenCalled();
  });
});
