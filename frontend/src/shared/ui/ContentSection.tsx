import type { ReactNode } from "react";
import { Card } from "react-bootstrap";

interface ContentSectionProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ContentSection({ title, actions, children }: ContentSectionProps) {
  return (
    <Card>
      <Card.Header className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
        <h2 className="h5 mb-0">{title}</h2>
        {actions ? <div className="d-flex gap-2">{actions}</div> : null}
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card>
  );
}
