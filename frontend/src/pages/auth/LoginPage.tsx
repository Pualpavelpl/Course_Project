import { useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  loginCandidate,
  loginRecruiter,
} from "../../shared/api/authApi";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { AuthShell } from "../../shared/auth/AuthShell";
import {
  CredentialsForm,
  type Credentials,
} from "../../shared/auth/CredentialsForm";

type LoginMode = "employee" | "candidate";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("employee");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = async (credentials: Credentials) => {
    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      if (mode === "employee") {
        await loginRecruiter(credentials);
        navigate("/recruiter/positions");
      } else {
        await loginCandidate(credentials);
        navigate("/candidate/profile");
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to log in"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setErrorMessage(undefined);
  };

  return (
    <AuthShell>
      <ButtonGroup className="mb-3" aria-label="Account type">
        <Button
          variant={mode === "employee" ? "success" : "outline-secondary"}
          onClick={() => selectMode("employee")}
          disabled={isSubmitting}
        >
          Log in as an employee
        </Button>
        <Button
          variant={mode === "candidate" ? "success" : "outline-secondary"}
          onClick={() => selectMode("candidate")}
          disabled={isSubmitting}
        >
          Log in as a candidate
        </Button>
      </ButtonGroup>
      <CredentialsForm
        submitLabel="Log in"
        secondaryLabel="Create candidate account"
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={login}
        onSecondary={() => navigate("/register")}
      />
    </AuthShell>
  );
}
