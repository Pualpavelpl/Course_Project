import { useState } from "react";
import { Alert, Badge, Button } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { ContentSection } from "../../shared/ui/ContentSection";
import { PageHeader } from "../../shared/ui/PageHeader";
import { initialPositions } from "../positions/positions.mock";
import { initialCandidateCvs } from "./candidateCvs.mock";

export function CandidatePositionPage() {
  const { positionId } = useParams();
  const position = initialPositions.find((item) => item.id === positionId);
  const [applied, setApplied] = useState(() =>
    initialCandidateCvs.some((cv) => cv.positionId === positionId),
  );

  if (!position) {
    return (
      <Alert variant="warning">
        Position not found. <Link to="/candidate/positions">Return to positions</Link>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title={position.name}
        actions={
          <Button variant="success" disabled={applied} onClick={() => setApplied(true)}>
            {applied ? "CV already created" : "Apply for position"}
          </Button>
        }
      />
      {applied ? (
        <Alert variant="success">
          Your CV for this position is available on the <Link to="/candidate/cvs">My CVs</Link> page.
        </Alert>
      ) : null}
      <div className="d-grid gap-3">
        <ContentSection title="Description">
          <p className="mb-0">{position.description}</p>
        </ContentSection>
        <ContentSection title="Tags">
          <div className="d-flex flex-wrap gap-2">
            {position.tags.map((tag) => <Badge key={tag} bg="secondary">{tag}</Badge>)}
          </div>
        </ContentSection>
      </div>
    </>
  );
}
