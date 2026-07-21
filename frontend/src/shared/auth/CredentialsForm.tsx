import type { FormEvent } from "react";
import { Button, Card, Form } from "react-bootstrap";

interface CredentialsFormProps {
  submitLabel: string;
  secondaryLabel: string;
  onSubmit: () => void;
  onSecondary: () => void;
}

export function CredentialsForm({
  submitLabel,
  secondaryLabel,
  onSubmit,
  onSecondary,
}: CredentialsFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Card className="login-card w-100">
      <Card.Body className="p-4 p-sm-5">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="credentialsEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" required />
          </Form.Group>
          <Form.Group className="mb-4" controlId="credentialsPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" required />
          </Form.Group>
          <div className="d-grid gap-2">
            <Button type="submit" variant="success" size="lg">
              {submitLabel}
            </Button>
            <Button type="button" variant="link" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
