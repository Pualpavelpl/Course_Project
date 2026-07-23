import { Card, Form } from "react-bootstrap";
import {
  attributeCategories,
  attributeCategoryLabels,
  attributeTypeLabels,
  attributeTypes,
  type AttributeCategory,
  type AttributeType,
} from "./attributes.api";

export interface AttributeFormValue {
  name: string;
  description: string;
  type: AttributeType | "";
  category: AttributeCategory | "";
  optionsText: string;
}

interface AttributeFormProps {
  value: AttributeFormValue;
  onChange: (value: AttributeFormValue) => void;
  protectedStructure?: boolean | undefined;
  disabled?: boolean | undefined;
}

export function AttributeForm({
  value,
  onChange,
  protectedStructure = false,
  disabled = false,
}: AttributeFormProps) {
  const structureDisabled = disabled || protectedStructure;

  return (
    <Card>
      <Card.Body className="d-grid gap-3">
        <Form.Group controlId="attributeName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            disabled={structureDisabled}
            maxLength={255}
            required
          />
        </Form.Group>
        <Form.Group controlId="attributeDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={value.description}
            onChange={(event) =>
              onChange({ ...value, description: event.target.value })
            }
            disabled={disabled}
            maxLength={5000}
            required
          />
        </Form.Group>
        <Form.Group controlId="attributeType">
          <Form.Label>Type</Form.Label>
          <Form.Select
            value={value.type}
            onChange={(event) =>
              onChange({
                ...value,
                type: event.target.value as AttributeType | "",
                optionsText:
                  event.target.value === "SINGLE_SELECT"
                    ? value.optionsText
                    : "",
              })
            }
            disabled={structureDisabled}
            required
          >
            <option value="" disabled>
              Select type
            </option>
            {attributeTypes.map((type) => (
              <option key={type} value={type}>
                {attributeTypeLabels[type]}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="attributeCategory">
          <Form.Label>Category</Form.Label>
          <Form.Select
            value={value.category}
            onChange={(event) =>
              onChange({
                ...value,
                category: event.target.value as AttributeCategory | "",
              })
            }
            disabled={structureDisabled}
            required
          >
            <option value="" disabled>
              Select category
            </option>
            {attributeCategories.map((category) => (
              <option key={category} value={category}>
                {attributeCategoryLabels[category]}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        {value.type === "SINGLE_SELECT" ? (
          <Form.Group controlId="attributeOptions">
            <Form.Label>Options</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={value.optionsText}
              onChange={(event) =>
                onChange({ ...value, optionsText: event.target.value })
              }
              disabled={structureDisabled}
              placeholder={"A1\nA2\nB1"}
              required
            />
            <Form.Text muted>Enter one option per line.</Form.Text>
          </Form.Group>
        ) : null}
      </Card.Body>
    </Card>
  );
}
