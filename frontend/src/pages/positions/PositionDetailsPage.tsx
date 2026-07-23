import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  attributeCategoryLabels,
  attributeTypeLabels,
} from "../attributes/attributes.api";
import {
  accessOperatorLabels,
  getPosition,
  type PositionAttribute,
  type RecruiterPositionDetail,
} from "./positions.api";

const attributeColumns: TableColumn<PositionAttribute>[] = [
  {
    key: "order",
    header: "Order",
    render: (attribute) => attribute.sortOrder + 1,
  },
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  {
    key: "type",
    header: "Type",
    render: (attribute) => attributeTypeLabels[attribute.type],
  },
  {
    key: "category",
    header: "Category",
    render: (attribute) => attributeCategoryLabels[attribute.category],
  },
];

export function PositionDetailsPage() {
  const navigate = useNavigate();
  const { positionId } = useParams();
  const [position, setPosition] =
    useState<RecruiterPositionDetail>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPosition() {
      if (!positionId) {
        setErrorMessage("Position id is missing");
        setIsLoading(false);
        return;
      }

      try {
        setPosition(
          await getPosition(positionId, abortController.signal),
        );
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Position"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPosition();
    return () => abortController.abort();
  }, [positionId]);

  if (isLoading) {
    return <Alert variant="info">Loading Position...</Alert>;
  }

  if (!position) {
    return <Alert variant="danger">{errorMessage ?? "Position not found"}</Alert>;
  }

  const accessRuleValue =
    position.accessRule?.option?.value ?? position.accessRule?.value;

  return (
    <>
      <PageHeader
        title={position.name}
        actions={
          <Button variant="outline-secondary" onClick={() => navigate("edit")}>
            Edit position
          </Button>
        }
      />

      <div className="d-grid gap-3">
        <Card>
          <Card.Header>Description</Card.Header>
          <Card.Body>{position.description}</Card.Body>
        </Card>
        <Card>
          <Card.Header>Template settings</Card.Header>
          <Card.Body>
            <p>Maximum projects: {position.maxProjects}</p>
            <p className="mb-0">
              Access: {position.isPublic ? "Public" : "Restricted"}
            </p>
            {position.accessRule ? (
              <p className="mb-0 mt-2">
                {position.accessRule.attribute.name}{" "}
                {accessOperatorLabels[position.accessRule.operator]}{" "}
                {accessRuleValue}
              </p>
            ) : null}
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Attributes</Card.Header>
          <Card.Body>
            <DataTable
              rows={position.attributes}
              columns={attributeColumns}
              emptyMessage="No Position Attributes"
            />
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>Tags</Card.Header>
          <Card.Body className="d-flex flex-wrap gap-2">
            {position.tags.length > 0 ? (
              position.tags.map((tag) => (
                <Badge key={tag.id} bg="secondary">
                  {tag.name}
                </Badge>
              ))
            ) : (
              <span className="text-secondary">No tags</span>
            )}
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>CVs</Card.Header>
          <Card.Body className="text-secondary">
            CV integration is not implemented yet.
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
