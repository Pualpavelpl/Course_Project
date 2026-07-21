import { Badge, Button, Card } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../shared/ui/PageHeader";
import { initialPositions } from "./positions.mock";

export function PositionDetailsPage() {
  const navigate = useNavigate();
  const { positionId } = useParams();
  const position = initialPositions.find((item) => item.id === positionId);

  if (!position) {
    return (
      <Card>
        <Card.Body>
          Position not found. <Link to="/recruiter/positions">Back to positions</Link>
        </Card.Body>
      </Card>
    );
  }

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
          <Card.Header>Tags</Card.Header>
          <Card.Body className="d-flex flex-wrap gap-2">
            {position.tags.map((tag) => (
              <Badge key={tag} bg="secondary">
                {tag}
              </Badge>
            ))}
          </Card.Body>
        </Card>
        <Card>
          <Card.Header>CVs</Card.Header>
          <Card.Body className="text-secondary">No CVs in the frontend skeleton.</Card.Body>
        </Card>
      </div>
    </>
  );
}
