import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCandidate } from "../../shared/api/authApi";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { AuthShell } from "../../shared/auth/AuthShell";
import {
  CredentialsForm,
  type Credentials,
} from "../../shared/auth/CredentialsForm";

export function RegisterPage() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = async (credentials: Credentials) => {
    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      await registerCandidate(credentials);
      navigate("/candidate/profile");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to create candidate account"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="h4 mb-3">Create candidate account</h2>
      <CredentialsForm
        submitLabel="Create account"
        secondaryLabel="Back to login"
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        passwordAutoComplete="new-password"
        onSubmit={register}
        onSecondary={() => navigate("/login")}
      />
    </AuthShell>
  );
}
