import { useMemo, useState } from "react";
import { Badge, Button, Tab, Tabs } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ContentSection } from "../../shared/ui/ContentSection";
import type { TableColumn } from "../../shared/ui/DataTable";
import { ExpandableText } from "../../shared/ui/ExpandableText";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SearchableTable } from "../../shared/ui/SearchableTable";
import { initialCandidateCvs } from "./candidateCvs.mock";
import {
  initialInfoAttributes,
  initialProjects,
  meAttributes,
  type ProfileAttributeListItem,
  type ProjectListItem,
} from "./profile.mock";

interface CvTag {
  id: string;
  name: string;
}

const projectColumns: TableColumn<ProjectListItem>[] = [
  { key: "name", header: "Name", render: (project) => project.name },
  { key: "period", header: "Period", render: (project) => project.period },
  {
    key: "description",
    header: "Description",
    render: (project) => <ExpandableText text={project.description} />,
  },
  {
    key: "tags",
    header: "Tags",
    render: (project) => project.tags.map((tag) => (
      <Badge key={tag} bg="secondary" className="me-1">{tag}</Badge>
    )),
  },
];

const attributeColumns: TableColumn<ProfileAttributeListItem>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  { key: "category", header: "Category", render: (attribute) => attribute.category },
  { key: "value", header: "Value", render: (attribute) => attribute.value },
];

const tagColumns: TableColumn<CvTag>[] = [
  { key: "name", header: "Name", render: (tag) => tag.name },
];

export function CandidateCvPage() {
  const { cvId } = useParams();
  const navigate = useNavigate();
  const cv = initialCandidateCvs.find((item) => item.id === cvId);
  const attributes = [...meAttributes, ...initialInfoAttributes];
  const initialTags = useMemo(() => [...new Set(initialProjects.flatMap((project) => project.tags))]
    .map((name) => ({ id: name.toLowerCase().replaceAll(" ", "-"), name })), []);
  const [tags, setTags] = useState<CvTag[]>(initialTags);

  if (!cv) {
    return <p>CV not found. <Link to="/candidate/cvs">Return to My CVs</Link></p>;
  }

  return (
    <>
      <PageHeader
        title={`${cv.positionName} CV`}
        actions={<Link to={`/candidate/positions/${cv.positionId}`}>View position</Link>}
      />
      <ContentSection title="Me">
        <SearchableTable
          rows={meAttributes}
          columns={attributeColumns}
          getSearchText={(attribute) => `${attribute.name} ${attribute.value}`}
          searchLabel="Search personal attributes"
          emptyMessage="No personal attributes"
        />
      </ContentSection>

      <Tabs defaultActiveKey="projects" className="mt-4 mb-3">
        <Tab eventKey="projects" title="Project">
          <SearchableTable
            rows={initialProjects}
            columns={projectColumns}
            getSearchText={(project) => `${project.name} ${project.description} ${project.tags.join(" ")}`}
            searchLabel="Search CV projects"
            emptyMessage="No projects in this CV"
            selectable
            actions={({ selectedIds }) => {
              const selectedId = selectedIds.size === 1 ? [...selectedIds][0] : undefined;
              return (
                <Button
                  variant="outline-secondary"
                  disabled={!selectedId}
                  onClick={() => selectedId && navigate(`/candidate/profile/projects/${selectedId}/edit`)}
                >
                  Edit
                </Button>
              );
            }}
          />
        </Tab>
        <Tab eventKey="attributes" title="Attribute">
          <SearchableTable
            rows={attributes}
            columns={attributeColumns}
            getSearchText={(attribute) => `${attribute.name} ${attribute.value} ${attribute.category}`}
            searchLabel="Search CV attributes"
            emptyMessage="No attributes in this CV"
          />
        </Tab>
        <Tab eventKey="tags" title="Tags">
          <SearchableTable
            rows={tags}
            columns={tagColumns}
            getSearchText={(tag) => tag.name}
            searchLabel="Search CV tags"
            emptyMessage="No tags in this CV"
            selectable
            actions={({ selectedIds, clearSelection }) => (
              <>
                <Button variant="success" onClick={() => navigate("tags/add")}>Add</Button>
                <Button
                  variant="outline-danger"
                  disabled={selectedIds.size === 0}
                  onClick={() => {
                    setTags((current) => current.filter((tag) => !selectedIds.has(tag.id)));
                    clearSelection();
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          />
        </Tab>
      </Tabs>
    </>
  );
}
