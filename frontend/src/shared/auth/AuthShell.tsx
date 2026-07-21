import type { ReactNode } from "react";
import { Container } from "react-bootstrap";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="login-layout p-3 p-md-4">
      <header className="border rounded bg-white p-4 text-center">
        <h1 className="h3 mb-2">Recruitment platform</h1>
        <p className="text-secondary mb-0">Reusable profiles and position-specific CVs</p>
      </header>
      <Container className="d-flex flex-column align-items-center justify-content-center py-4">
        {children}
      </Container>
      <footer className="border rounded bg-white p-3 text-center text-secondary small">
        Recruitment platform
      </footer>
    </div>
  );
}
