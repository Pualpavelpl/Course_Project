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
}

export function EntityCreatePage({
  title,
  listLabel,
  listPath,
  createLabel,
  submitLabel,
  children,
}: EntityCreatePageProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          <Button type="submit" variant="success">
            {submitLabel}
          </Button>
        </div>
        {saved ? <Alert variant="success">Saved in the frontend mock.</Alert> : null}
        <div className="d-grid gap-3">{children}</div>
      </Form>
    </>
  );
}
