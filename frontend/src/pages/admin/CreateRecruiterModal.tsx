import { useState, type FormEvent } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { createRecruiter } from "./adminUsers.api";

interface CreateRecruiterModalProps {
  show: boolean;
  onHide: () => void;
  onCreated: (email: string) => void;
}

export function CreateRecruiterModal({
  show,
  onHide,
  onCreated,
}: CreateRecruiterModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const close = () => {
    if (isSubmitting) return;
    setEmail("");
    setPassword("");
    setErrorMessage(undefined);
    onHide();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      const recruiter = await createRecruiter({ email, password });

      setEmail("");
      setPassword("");
      onCreated(recruiter.email);
      onHide();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to create Recruiter"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={close} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title>Create Recruiter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-secondary">
            The Recruiter will use these credentials with Log in as an
            employee.
          </p>
          <Form.Group className="mb-3" controlId="recruiterEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </Form.Group>
          <Form.Group controlId="recruiterPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              required
            />
            <Form.Text>Password must contain at least 8 characters.</Form.Text>
          </Form.Group>
          {errorMessage ? (
            <Alert variant="danger" className="mt-3 mb-0">
              {errorMessage}
            </Alert>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="outline-secondary"
            onClick={close}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Recruiter"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
