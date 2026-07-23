import { useEffect, useState } from "react";
import { Alert, Badge, Tab, Tabs } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { ContentSection } from "../../shared/ui/ContentSection";
import type { TableColumn } from "../../shared/ui/DataTable";
import { ExpandableText } from "../../shared/ui/ExpandableText";
import { MarkdownText } from "../../shared/ui/MarkdownText";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SearchableTable } from "../../shared/ui/SearchableTable";
import { attributeCategoryLabels } from "../attributes/attributes.api";
import type { CandidateProject } from "../candidate/projects.api";
import {
  getRecruiterCv,
  type CvAttribute,
  type CvDetail,
} from "./cvs.api";

const attributeColumns: TableColumn<CvAttribute>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  {
    key: "category",
    header: "Category",
    render: (attribute) => attributeCategoryLabels[attribute.category],
  },
  {
    key: "value",
    header: "Value",
    render: (attribute) => attribute.displayValue || "Not provided",
  },
];

const projectColumns: TableColumn<CandidateProject>[] = [
  { key: "name", header: "Name", render: (project) => project.name },
  {
    key: "period",
    header: "Period",
    render: (project) =>
      project.periodEnd
        ? `${project.periodStart} – ${project.periodEnd}`
        : `${project.periodStart} – Present`,
  },
  {
    key: "description",
    header: "Description",
    render: (project) => (
      <ExpandableText
        text={project.description}
        renderText={(text) => <MarkdownText text={text} />}
      />
    ),
  },
  {
    key: "tags",
    header: "Tags",
    render: (project) =>
      project.tags.map((tag) => (
        <Badge key={tag.id} bg="secondary" className="me-1">
          {tag.name}
        </Badge>
      )),
  },
];

export function RecruiterCvPage() {
  const { cvId } = useParams();
  const [cv, setCv] = useState<CvDetail>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCv() {
      if (!cvId) {
        setErrorMessage("CV id is missing");
        setIsLoading(false);
        return;
      }

      try {
        setCv(await getRecruiterCv(cvId, abortController.signal));
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(getApiErrorMessage(error, "Unable to load CV"));
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadCv();
    return () => abortController.abort();
  }, [cvId]);

  if (isLoading) return <Alert variant="info">Loading CV...</Alert>;
  if (!cv) return <Alert variant="warning">{errorMessage ?? "CV not found"}</Alert>;

  return (
    <>
      <PageHeader
        title={`${cv.position.name} CV`}
        actions={
          <div className="d-flex gap-3">
            <Link to={`/recruiter/positions/${cv.position.id}`}>
              View position
            </Link>
            <Link to={`/recruiter/profiles/${cv.profile.id}`}>
              View profile
            </Link>
          </div>
        }
      />
      <ContentSection title="Candidate">
        <p className="mb-0">{cv.profile.candidate.email}</p>
      </ContentSection>
      <Tabs defaultActiveKey="projects" className="mt-4 mb-3">
        <Tab eventKey="projects" title="Project">
          <SearchableTable
            rows={cv.projects}
            columns={projectColumns}
            getSearchText={(project) => project.name}
            searchLabel="Search CV projects"
            emptyMessage="No matching projects"
          />
        </Tab>
        <Tab eventKey="attributes" title="Attribute">
          <SearchableTable
            rows={cv.attributes}
            columns={attributeColumns}
            getSearchText={(attribute) =>
              `${attribute.name} ${attribute.displayValue}`
            }
            searchLabel="Search CV attributes"
            emptyMessage="No Attributes"
          />
        </Tab>
        <Tab eventKey="tags" title="Tags">
          <SearchableTable
            rows={cv.tags}
            columns={[
              { key: "name", header: "Name", render: (tag) => tag.name },
            ]}
            getSearchText={(tag) => tag.name}
            searchLabel="Search Position Tags"
            emptyMessage="No Position Tags"
          />
        </Tab>
      </Tabs>
    </>
  );
}
