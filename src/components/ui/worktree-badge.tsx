import { Badge } from "./badge";

interface WorktreeBadgeProps {
  className?: string;
}

export function WorktreeBadge({ className }: WorktreeBadgeProps) {
  return (
    <Badge variant="secondary" className={className}>
      🌱 Worktree
    </Badge>
  );
}