import { Button, Card, ListGroup } from "react-bootstrap";
import type { AttributeListItem } from "../attributes/attributes.api";

interface OrderedAttributeSelectionProps {
  attributes: AttributeListItem[];
  onMove: (index: number, direction: -1 | 1) => void;
  disabled?: boolean | undefined;
}

export function OrderedAttributeSelection({
  attributes,
  onMove,
  disabled = false,
}: OrderedAttributeSelectionProps) {
  return (
    <Card>
      <Card.Header>Selected Attribute order</Card.Header>
      <Card.Body>
        {attributes.length === 0 ? (
          <p className="mb-0 text-secondary">No Attributes selected.</p>
        ) : (
          <ListGroup>
            {attributes.map((attribute, index) => (
              <ListGroup.Item
                key={attribute.id}
                className="d-flex justify-content-between align-items-center gap-3"
              >
                <span>
                  {index + 1}. {attribute.name}
                </span>
                <div className="d-flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline-secondary"
                    disabled={disabled || index === 0}
                    onClick={() => onMove(index, -1)}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline-secondary"
                    disabled={disabled || index === attributes.length - 1}
                    onClick={() => onMove(index, 1)}
                  >
                    Down
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
}
