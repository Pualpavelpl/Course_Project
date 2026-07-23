import { Card, Form } from "react-bootstrap";
import type {
  AttributeDetail,
  AttributeListItem,
} from "../attributes/attributes.api";
import {
  accessOperatorLabels,
  getAllowedOperators,
  type AccessOperator,
} from "./positions.api";

export interface PositionFormValue {
  name: string;
  description: string;
  maxProjects: number;
  isPublic: boolean;
  accessAttributeId: string;
  accessOperator: AccessOperator | "";
  accessOptionId: string;
  accessValue: string;
  customTags: string;
}

interface PositionFieldsCardProps {
  value: PositionFormValue;
  onChange: (value: PositionFormValue) => void;
  selectedAttributes: AttributeListItem[];
  accessAttribute?: AttributeDetail | undefined;
  disabled?: boolean | undefined;
}

export function PositionFieldsCard({
  value,
  onChange,
  selectedAttributes,
  accessAttribute,
  disabled = false,
}: PositionFieldsCardProps) {
  const allowedOperators = accessAttribute
    ? getAllowedOperators(accessAttribute.type)
    : [];

  const selectAccessAttribute = (attributeId: string) => {
    onChange({
      ...value,
      accessAttributeId: attributeId,
      accessOperator: "",
      accessOptionId: "",
      accessValue: "",
    });
  };

  return (
    <Card>
      <Card.Body className="d-grid gap-3">
        <Form.Group controlId="positionName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            disabled={disabled}
            maxLength={255}
            required
          />
        </Form.Group>
        <Form.Group controlId="positionDescription">
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
        <div className="row g-3">
          <Form.Group className="col-md-6" controlId="positionAccess">
            <Form.Label>Access</Form.Label>
            <Form.Select
              value={value.isPublic ? "PUBLIC" : "RESTRICTED"}
              onChange={(event) =>
                onChange({
                  ...value,
                  isPublic: event.target.value === "PUBLIC",
                  accessAttributeId: "",
                  accessOperator: "",
                  accessOptionId: "",
                  accessValue: "",
                })
              }
              disabled={disabled}
            >
              <option value="PUBLIC">Public</option>
              <option value="RESTRICTED">Restricted</option>
            </Form.Select>
          </Form.Group>
          <Form.Group
            className="col-md-6"
            controlId="positionMaxProjects"
          >
            <Form.Label>Maximum projects in CV</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={100}
              value={value.maxProjects}
              onChange={(event) =>
                onChange({
                  ...value,
                  maxProjects: Number(event.target.value),
                })
              }
              disabled={disabled}
              required
            />
          </Form.Group>
        </div>

        {!value.isPublic ? (
          <div className="row g-3">
            <Form.Group
              className="col-md-4"
              controlId="positionAccessAttribute"
            >
              <Form.Label>Access Attribute</Form.Label>
              <Form.Select
                value={value.accessAttributeId}
                onChange={(event) =>
                  selectAccessAttribute(event.target.value)
                }
                disabled={disabled}
                required
              >
                <option value="" disabled>
                  Select Attribute
                </option>
                {selectedAttributes.map((attribute) => (
                  <option key={attribute.id} value={attribute.id}>
                    {attribute.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group
              className="col-md-4"
              controlId="positionAccessOperator"
            >
              <Form.Label>Operator</Form.Label>
              <Form.Select
                value={value.accessOperator}
                onChange={(event) =>
                  onChange({
                    ...value,
                    accessOperator:
                      event.target.value as AccessOperator | "",
                  })
                }
                disabled={disabled || !accessAttribute}
                required
              >
                <option value="" disabled>
                  Select operator
                </option>
                {allowedOperators.map((operator) => (
                  <option key={operator} value={operator}>
                    {accessOperatorLabels[operator]}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group
              className="col-md-4"
              controlId="positionAccessValue"
            >
              <Form.Label>Value</Form.Label>
              {accessAttribute?.type === "SINGLE_SELECT" ? (
                <Form.Select
                  value={value.accessOptionId}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      accessOptionId: event.target.value,
                    })
                  }
                  disabled={disabled}
                  required
                >
                  <option value="" disabled>
                    Select option
                  </option>
                  {accessAttribute.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.value}
                    </option>
                  ))}
                </Form.Select>
              ) : accessAttribute?.type === "BOOLEAN" ? (
                <Form.Select
                  value={value.accessValue}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      accessValue: event.target.value,
                    })
                  }
                  disabled={disabled}
                  required
                >
                  <option value="" disabled>
                    Select value
                  </option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </Form.Select>
              ) : (
                <Form.Control
                  type={
                    accessAttribute?.type === "NUMBER"
                      ? "number"
                      : accessAttribute?.type === "DATE"
                        ? "date"
                        : "text"
                  }
                  value={value.accessValue}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      accessValue: event.target.value,
                    })
                  }
                  disabled={disabled || !accessAttribute}
                  required
                />
              )}
            </Form.Group>
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
