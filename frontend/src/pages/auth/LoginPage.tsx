import { useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "../../shared/auth/AuthShell";
import { CredentialsForm } from "../../shared/auth/CredentialsForm";

type LoginMode = "employee" | "candidate";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("employee");

  const login = () => {
    navigate(mode === "employee" ? "/recruiter/positions" : "/candidate/profile");
  };

  return (
    <AuthShell>
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
      <CredentialsForm
        submitLabel="Log in"
        secondaryLabel="Create candidate account"
        onSubmit={login}
        onSecondary={() => navigate("/register")}
      />
    </AuthShell>
  );
}
