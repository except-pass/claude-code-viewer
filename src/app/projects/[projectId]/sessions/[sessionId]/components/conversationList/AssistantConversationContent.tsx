import { ChevronRight, Edit, Lightbulb, Settings } from "lucide-react";
import Image from "next/image";
import type { FC } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ToolResultContent } from "@/lib/conversation-schema/content/ToolResultContentSchema";
import type { AssistantMessageContent } from "@/lib/conversation-schema/message/AssistantMessageSchema";
import { MarkdownContent } from "../../../../../../components/MarkdownContent";

export const AssistantConversationContent: FC<{
  content: AssistantMessageContent;
  getToolResult: (toolUseId: string) => ToolResultContent | undefined;
}> = ({ content, getToolResult }) => {
  if (content.type === "text") {
    return (
      <div className="w-full mx-1 sm:mx-2 my-4 sm:my-6">
        <MarkdownContent content={content.text} />
      </div>
    );
  }

  if (content.type === "thinking") {
    return (
      <Card className="bg-muted/50 border-dashed gap-2 py-3 mb-2">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/80 rounded-t-lg transition-colors py-0 px-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Thinking</CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="py-0 px-4">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                {content.thinking}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  if (content.type === "tool_use") {
    const toolResult = getToolResult(content.id);
    
    // Check if this is an Edit or MultiEdit tool and extract file_path
    const isEditTool = content.name === "Edit" || content.name === "MultiEdit";
    const filePath = isEditTool && content.input && typeof content.input === 'object' && 'file_path' in content.input 
      ? (content.input as { file_path: string }).file_path 
      : null;
    
    const handleOpenInCursor = async () => {
      if (filePath) {
        try {
          // Execute cursor command as child process
          const response = await fetch('/api/cursor-open', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePath }),
          });
          
          if (!response.ok) {
            console.error('Failed to open file in Cursor:', await response.text());
          }
        } catch (error) {
          console.error('Error opening file in Cursor:', error);
        }
      }
    };

    return (
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 gap-2 py-3 mb-2">
        {/* Edit button for Edit/MultiEdit tools */}
        {isEditTool && filePath && (
          <div className="px-4 pt-3 pb-2 border-b border-blue-200/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInCursor}
              className="h-auto p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100/50 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-800/30"
            >
              <Edit className="h-3 w-3 mr-1" />
              <span className="text-xs font-mono truncate max-w-[200px]" title={filePath}>
                {filePath.split('/').pop() || filePath}
              </span>
            </Button>
          </div>
        )}
        
        <CardHeader className="py-0 px-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-sm font-medium">Tool Use</CardTitle>
            <Badge
              variant="outline"
              className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
            >
              {content.name}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Tool execution with ID: {content.id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 py-0 px-4">
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  Input Parameters
                </h4>
                <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SyntaxHighlighter
                style={oneLight}
                language="json"
                PreTag="div"
                className="text-xs"
              >
                {JSON.stringify(content.input, null, 2)}
              </SyntaxHighlighter>
            </CollapsibleContent>
          </Collapsible>
          {toolResult && (
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Tool Result
                  </h4>
                  <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-background rounded border p-2 mt-1">
                  {typeof toolResult.content === "string" ? (
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                      {toolResult.content}
                    </pre>
                  ) : (
                    toolResult.content.map((item) => {
                      if (item.type === "image") {
                        return (
                          <Image
                            key={item.source.data}
                            src={`data:${item.source.media_type};base64,${item.source.data}`}
                            alt="Tool Result"
                          />
                        );
                      }
                      if (item.type === "text") {
                        return (
                          <pre
                            key={item.text}
                            className="text-xs overflow-x-auto whitespace-pre-wrap break-words"
                          >
                            {item.text}
                          </pre>
                        );
                      }
                      item satisfies never;
                      throw new Error("Unexpected tool result content type");
                    })
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    );
  }

  if (content.type === "tool_result") {
    return null;
  }

  return null;
};
