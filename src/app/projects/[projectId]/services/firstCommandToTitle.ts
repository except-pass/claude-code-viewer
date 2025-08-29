import type { ParsedCommand } from "../../../../server/service/parseCommandXml";

export const firstCommandToTitle = (firstCommand: ParsedCommand) => {
  switch (firstCommand.kind) {
    case "command":
      return `${firstCommand.commandName} ${firstCommand.commandArgs}`;
    case "local-command-1":
      return firstCommand.commandMessage;
    case "local-command-2":
      return firstCommand.stdout;
    case "text":
      return firstCommand.content;
    default:
      firstCommand satisfies never;
      throw new Error("Invalid first command");
  }
};
