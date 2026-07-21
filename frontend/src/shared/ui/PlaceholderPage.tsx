import { Card } from "react-bootstrap";
import { PageHeader } from "./PageHeader";

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <Card.Body className="p-4 text-secondary">
          This section will be implemented in the next step.
        </Card.Body>
      </Card>
    </>
  );
}
