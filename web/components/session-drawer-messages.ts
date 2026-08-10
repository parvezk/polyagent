interface MessageWithContent {
  content: string;
}

export function shouldRenderFirstMessage(
  firstMessage: string | undefined,
  messages: readonly MessageWithContent[] = [],
) {
  return Boolean(firstMessage) && !messages.some((message) => message.content === firstMessage);
}
