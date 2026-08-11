import pc from "picocolors";
/**
 * The PolyAgent brand banner. Reprinted at the top of every watch redraw so it
 * reads as a persistent "sticky" header for the duration of the session.
 */
export function banner(subtitle) {
  const title = pc.bold(pc.cyan("◆ PolyAgent"));
  const tag = pc.dim("· vendor-agnostic agent control plane");
  const line = pc.dim("─".repeat(60));
  const sub = subtitle ? `\n${pc.dim(subtitle)}` : "";
  return `${title} ${tag}\n${line}${sub}`;
}
