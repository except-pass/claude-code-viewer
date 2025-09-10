import { ChevronRight } from "lucide-react";
import type { FC, PropsWithChildren } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const SummaryConversationContent: FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2 mb-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            Summarized
          </h4>
          <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-background rounded border p-3 mt-2">
          <pre className="text-xs overflow-x-auto">{children}</pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
