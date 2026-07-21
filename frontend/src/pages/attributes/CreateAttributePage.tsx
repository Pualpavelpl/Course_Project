import { Card, Form } from "react-bootstrap";
import { EntityCreatePage } from "../../shared/ui/EntityCreatePage";
import { attributeCategories, attributeTypes } from "./attributes.mock";

export function CreateAttributePage() {
  return (
    <EntityCreatePage
      title="Create attribute"
      listLabel="View attributes"
      listPath="/recruiter/attributes"
      createLabel="Create attribute"
      submitLabel="Create attribute"
    >
      <Card>
        <Card.Body className="d-grid gap-3">
          <Form.Group controlId="attributeName">
            <Form.Label>Name</Form.Label>
            <Form.Control required />
          </Form.Group>
          <Form.Group controlId="attributeDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} required />
          </Form.Group>
          <Form.Group controlId="attributeType">
            <Form.Label>Type</Form.Label>
            <Form.Select required defaultValue="">
              <option value="" disabled>Select type</option>
              {attributeTypes.map((type) => <option key={type}>{type}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="attributeCategory">
            <Form.Label>Category</Form.Label>
            <Form.Select required defaultValue="">
              <option value="" disabled>Select category</option>
              {attributeCategories.map((category) => <option key={category}>{category}</option>)}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>
    </EntityCreatePage>
  );
}
