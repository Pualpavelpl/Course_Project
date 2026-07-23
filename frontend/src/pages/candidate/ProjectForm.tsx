import { Card, Form } from "react-bootstrap";

export interface ProjectFormValue {
  name: string;
  periodStart: string;
  periodEnd: string;
  description: string;
  tagsText: string;
}

interface ProjectFormProps {
  value: ProjectFormValue;
  onChange: (value: ProjectFormValue) => void;
  disabled?: boolean | undefined;
}

export function ProjectForm({
  value,
  onChange,
  disabled = false,
}: ProjectFormProps) {
  return (
    <Card>
      <Card.Body className="d-grid gap-3">
        <Form.Group controlId="projectName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            maxLength={255}
            disabled={disabled}
            required
          />
        </Form.Group>
        <div className="row g-3">
          <Form.Group className="col-md-6" controlId="projectStartDate">
            <Form.Label>Period start</Form.Label>
            <Form.Control
              type="date"
              value={value.periodStart}
              onChange={(event) =>
                onChange({ ...value, periodStart: event.target.value })
              }
              disabled={disabled}
              required
            />
          </Form.Group>
          <Form.Group className="col-md-6" controlId="projectEndDate">
            <Form.Label>Period end</Form.Label>
            <Form.Control
              type="date"
              value={value.periodEnd}
              min={value.periodStart || undefined}
              onChange={(event) =>
                onChange({ ...value, periodEnd: event.target.value })
              }
              disabled={disabled}
            />
          </Form.Group>
        </div>
        <Form.Group controlId="projectDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={8}
            value={value.description}
            onChange={(event) =>
              onChange({ ...value, description: event.target.value })
            }
            disabled={disabled}
            required
          />
          <Form.Text>
            Markdown is supported. Raw HTML is not rendered.
          </Form.Text>
        </Form.Group>
        <Form.Group controlId="projectTags">
          <Form.Label>Tags</Form.Label>
          <Form.Control
            value={value.tagsText}
            onChange={(event) =>
              onChange({ ...value, tagsText: event.target.value })
            }
            placeholder="React, TypeScript"
            disabled={disabled}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
}
