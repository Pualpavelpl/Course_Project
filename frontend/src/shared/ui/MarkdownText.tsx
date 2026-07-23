import Markdown from "react-markdown";

interface MarkdownTextProps {
  text: string;
}

export function MarkdownText({ text }: MarkdownTextProps) {
  return <Markdown skipHtml>{text}</Markdown>;
}
