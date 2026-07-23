import { useState, type FormEvent, type ReactNode } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "./PageHeader";

interface EntityCreatePageProps {
  title: string;
  listLabel: string;
  listPath: string;
  createLabel: string;
  submitLabel: string;
  children: ReactNode;
  errorMessage?: string | undefined;
  isSubmitting?: boolean | undefined;
  submitDisabled?: boolean | undefined;
  onSubmit?: (() => Promise<void> | void) | undefined;
}

export function EntityCreatePage({
  title,
  listLabel,
  listPath,
  createLabel,
  submitLabel,
  children,
  errorMessage,
  isSubmitting = false,
  submitDisabled = false,
  onSubmit,
}: EntityCreatePageProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (onSubmit) {
      await onSubmit();
      return;
    }

    setSaved(true);
  };

  return (
    <>
      <PageHeader title={title} />
      <Form onSubmit={handleSubmit}>
        <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mb-3">
          <div className="d-flex gap-2">
            <Button type="button" variant="outline-secondary" onClick={() => navigate(listPath)}>
              {listLabel}
            </Button>
            <span className="btn btn-success" aria-current="page">
              {createLabel}
            </span>
          </div>
          <Button
            type="submit"
            variant="success"
            disabled={isSubmitting || submitDisabled}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
        {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
        {saved ? <Alert variant="success">Saved in the frontend mock.</Alert> : null}
        <div className="d-grid gap-3">{children}</div>
      </Form>
    </>
  );
}
