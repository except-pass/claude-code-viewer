const regExp = /<(?<tag>[^>]+)>(?<content>\s*[^<]*?\s*)<\/\k<tag>>/g;

export const parseCommandXml = (
  content: string
):
  | {
      kind: "command";
      commandName: string;
      commandArgs: string;
      commandMessage?: string;
    }
  | {
      kind: "local-command-1";
      commandName: string;
      commandMessage: string;
    }
  | {
      kind: "local-command-2";
      stdout: string;
    }
  | {
      kind: "text";
      content: string;
    } => {
  const matches = Array.from(content.matchAll(regExp)).map((match) => {
    return {
      tag: match.groups?.tag,
      content: match.groups?.content,
    };
  });

  if (matches.length === 0) {
    return {
      kind: "text",
      content,
    };
  }

  const commandName = matches.find(
    (match) => match.tag === "command-name"
  )?.content;
  const commandArgs = matches.find(
    (match) => match.tag === "command-args"
  )?.content;
  const commandMessage = matches.find(
    (match) => match.tag === "command-message"
  )?.content;
  const localCommandStdout = matches.find(
    (match) => match.tag === "local-command-stdout"
  )?.content;

  switch (true) {
    case commandName !== undefined && commandArgs !== undefined:
      return {
        kind: "command",
        commandName,
        commandArgs,
        commandMessage: commandMessage,
      };
    case commandName !== undefined && commandMessage !== undefined:
      return {
        kind: "local-command-1",
        commandName,
        commandMessage,
      };
    case localCommandStdout !== undefined:
      return {
        kind: "local-command-2",
        stdout: localCommandStdout,
      };
    default:
      return {
        kind: "text",
        content,
      };
  }
};