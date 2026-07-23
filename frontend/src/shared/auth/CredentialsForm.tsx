import { useState, type FormEvent } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";

export interface Credentials {
  email: string;
  password: string;
}

interface CredentialsFormProps {
  submitLabel: string;
  secondaryLabel: string;
  errorMessage?: string | undefined;
  isSubmitting?: boolean | undefined;
  passwordAutoComplete?: "current-password" | "new-password" | undefined;
  onSubmit: (credentials: Credentials) => Promise<void> | void;
  onSecondary: () => void;
}

export function CredentialsForm({
  submitLabel,
  secondaryLabel,
  errorMessage,
  isSubmitting = false,
  passwordAutoComplete = "current-password",
  onSubmit,
  onSecondary,
}: CredentialsFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ email, password });
  };

  return (
    <Card className="login-card w-100">
      <Card.Body className="p-4 p-sm-5">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="credentialsEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="credentialsPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              autoComplete={passwordAutoComplete}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </Form.Group>
          {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
          <div className="d-grid gap-2">
            <Button
              type="submit"
              variant="success"
              size="lg"
              disabled={isSubmitting}
            >
              {submitLabel}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={onSecondary}
              disabled={isSubmitting}
            >
              {secondaryLabel}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
