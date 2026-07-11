/** Admin operations centre base path (replaces legacy /admin). */
export const HARD_OPS_HOME = "/hard";

export function hardOpsPath(segment?: string) {
  if (!segment) return HARD_OPS_HOME;
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  return `${HARD_OPS_HOME}${normalized}`;
}
