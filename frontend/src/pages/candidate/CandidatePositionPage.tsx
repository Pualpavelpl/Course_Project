import { useEffect, useState } from "react";
import { Alert, Badge, Button } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { ContentSection } from "../../shared/ui/ContentSection";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  attributeCategoryLabels,
  attributeTypeLabels,
} from "../attributes/attributes.api";
import { createCv } from "../cvs/cvs.api";
import {
  getAvailablePosition,
  type CandidatePositionDetail,
  type PositionAttribute,
} from "../positions/positions.api";

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

export function CandidatePositionPage() {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const [position, setPosition] =
    useState<CandidatePositionDetail>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isCreatingCv, setIsCreatingCv] = useState(false);

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
          await getAvailablePosition(
            positionId,
            abortController.signal,
          ),
        );
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Position is not available"),
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
    return (
      <Alert variant="warning">
        {errorMessage ?? "Position not found"}.{" "}
        <Link to="/candidate/positions">Return to positions</Link>
      </Alert>
    );
  }

  const applyForPosition = async () => {
    setIsCreatingCv(true);
    setErrorMessage(undefined);

    try {
      const cv = await createCv(position.id);
      navigate(`/candidate/cvs/${cv.id}`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to create CV"));
    } finally {
      setIsCreatingCv(false);
    }
  };

  return (
    <>
      <PageHeader
        title={position.name}
        actions={
          <Button
            variant="success"
            disabled={isCreatingCv}
            onClick={() => void applyForPosition()}
          >
            {isCreatingCv ? "Creating CV..." : "Apply for position"}
          </Button>
        }
      />
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      <div className="d-grid gap-3">
        <ContentSection title="Description">
          <p className="mb-0">{position.description}</p>
        </ContentSection>
        <ContentSection title="Template Attributes">
          <DataTable
            rows={position.attributes}
            columns={attributeColumns}
            emptyMessage="No Position Attributes"
          />
        </ContentSection>
        <ContentSection title="Tags">
          <div className="d-flex flex-wrap gap-2">
            {position.tags.length > 0 ? (
              position.tags.map((tag) => (
                <Badge key={tag.id} bg="secondary">
                  {tag.name}
                </Badge>
              ))
            ) : (
              <span className="text-secondary">No tags</span>
            )}
          </div>
        </ContentSection>
      </div>
    </>
  );
}
