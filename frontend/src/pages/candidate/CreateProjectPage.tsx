import { Card, Form } from "react-bootstrap";
import { EntityCreatePage } from "../../shared/ui/EntityCreatePage";

export function CreateProjectPage() {
  return (
    <EntityCreatePage
      title="Create project"
      listLabel="Back to profile"
      listPath="/candidate/profile"
      createLabel="Create project"
      submitLabel="Create project"
    >
      <Card>
        <Card.Body className="d-grid gap-3">
          <Form.Group controlId="projectName">
            <Form.Label>Name</Form.Label>
            <Form.Control required />
          </Form.Group>
          <div className="row g-3">
            <Form.Group className="col-md-6" controlId="projectStartDate">
              <Form.Label>Period start</Form.Label>
              <Form.Control type="date" required />
            </Form.Group>
            <Form.Group className="col-md-6" controlId="projectEndDate">
              <Form.Label>Period end</Form.Label>
              <Form.Control type="date" />
            </Form.Group>
          </div>
          <Form.Group controlId="projectDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={8} required />
            <Form.Text>Long descriptions are supported and will be collapsed in the projects table.</Form.Text>
          </Form.Group>
          <Form.Group controlId="projectTags">
            <Form.Label>Tags</Form.Label>
            <Form.Control placeholder="React, TypeScript" />
          </Form.Group>
        </Card.Body>
      </Card>
    </EntityCreatePage>
  );
}
