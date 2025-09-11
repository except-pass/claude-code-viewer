import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface WorktreeBadgeProps {
  className?: string;
  isDirty?: boolean;
}

export function WorktreeBadge({ className, isDirty }: WorktreeBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        className,
        isDirty && "bg-red-50/60 border-red-300/60 text-red-700",
      )}
    >
      🌱 Worktree
    </Badge>
  );
}
