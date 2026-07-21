import { useState } from "react";
import { Button } from "react-bootstrap";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export function ExpandableText({ text, maxLength = 100 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) return text;

  return (
    <span>
      {expanded ? text : `${text.slice(0, maxLength)}…`}
      <Button variant="link" className="p-0 ms-1 align-baseline" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show less" : "Show more"}
      </Button>
    </span>
  );
}
