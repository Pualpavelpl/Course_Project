import { useState, type FormEvent } from "react";
import { Alert, Button, ButtonGroup, Card, Container, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

type LoginMode = "employee" | "candidate";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("employee");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "employee") {
      navigate("/recruiter/positions");
      return;
    }

    setMessage("Candidate interface will be added after the Recruiter skeleton.");
  };

  return (
    <div className="login-layout p-3 p-md-4">
      <header className="border rounded bg-white p-4 text-center">
        <h1 className="h3 mb-2">Recruitment platform</h1>
        <p className="text-secondary mb-0">
          Reusable profiles and position-specific CVs
        </p>
      </header>

      <Container className="d-flex flex-column align-items-center justify-content-center py-4">
        <ButtonGroup className="mb-3" aria-label="Account type">
          <Button
            variant={mode === "employee" ? "success" : "outline-secondary"}
            onClick={() => setMode("employee")}
          >
            Log in as an employee
          </Button>
          <Button
            variant={mode === "candidate" ? "success" : "outline-secondary"}
            onClick={() => setMode("candidate")}
          >
            Log in as a candidate
          </Button>
        </ButtonGroup>

        <Card className="login-card w-100">
          <Card.Body className="p-4 p-sm-5">
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="loginEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" required />
              </Form.Group>

              <Form.Group className="mb-4" controlId="loginPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" required />
              </Form.Group>

              {message ? <Alert variant="info">{message}</Alert> : null}

              <div className="d-grid gap-2">
                <Button type="submit" variant="success" size="lg">
                  Log in
                </Button>
                <Button type="button" variant="link">
                  Create account
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>

      <footer className="border rounded bg-white p-3 text-center text-secondary small">
        Recruitment platform
      </footer>
    </div>
  );
}
