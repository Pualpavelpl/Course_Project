import { useNavigate } from "react-router-dom";
import { AuthShell } from "../../shared/auth/AuthShell";
import { CredentialsForm } from "../../shared/auth/CredentialsForm";

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <AuthShell>
      <h2 className="h4 mb-3">Create candidate account</h2>
      <CredentialsForm
        submitLabel="Create account"
        secondaryLabel="Back to login"
        onSubmit={() => navigate("/candidate/profile")}
        onSecondary={() => navigate("/login")}
      />
    </AuthShell>
  );
}
