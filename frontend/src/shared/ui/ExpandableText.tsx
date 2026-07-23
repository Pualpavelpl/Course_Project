import { useState, type ReactNode } from "react";
import { Button } from "react-bootstrap";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  renderText?: ((text: string) => ReactNode) | undefined;
}

export function ExpandableText({
  text,
  maxLength = 100,
  renderText = (value) => value,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) return renderText(text);

  const visibleText = expanded ? text : `${text.slice(0, maxLength)}…`;

  return (
    <div>
      {renderText(visibleText)}
      <Button variant="link" className="p-0 ms-1 align-baseline" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show less" : "Show more"}
      </Button>
    </div>
  );
}
