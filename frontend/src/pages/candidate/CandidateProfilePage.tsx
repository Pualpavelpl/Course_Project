import { useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { FilterOption } from "../../shared/hooks/useTableControls";
import { useTableControls } from "../../shared/hooks/useTableControls";
import { ContentSection } from "../../shared/ui/ContentSection";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { ExpandableText } from "../../shared/ui/ExpandableText";
import { ListToolbar } from "../../shared/ui/ListToolbar";
import { PageHeader } from "../../shared/ui/PageHeader";
import { attributeCategories } from "../attributes/attributes.mock";
import {
  initialInfoAttributes,
  initialProjects,
  meAttributes,
  type ProfileAttributeListItem,
  type ProjectListItem,
} from "./profile.mock";

const attributeColumns: TableColumn<ProfileAttributeListItem>[] = [
  { key: "name", header: "Attribute", render: (attribute) => attribute.name },
  { key: "value", header: "Value", render: (attribute) => attribute.value },
  { key: "category", header: "Category", render: (attribute) => attribute.category },
];

const attributeFilters: FilterOption<ProfileAttributeListItem>[] = attributeCategories.map((category) => ({
  label: category,
  matches: (attribute) => attribute.category === category,
}));

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
    render: (project) => (
      <div className="d-flex flex-wrap gap-1">
        {project.tags.map((tag) => <Badge key={tag} bg="secondary">{tag}</Badge>)}
      </div>
    ),
  },
];

export function CandidateProfilePage() {
  const navigate = useNavigate();
  const meControls = useTableControls(meAttributes, (attribute) => attribute.name, []);
  const [infoAttributes, setInfoAttributes] = useState(initialInfoAttributes);
  const infoControls = useTableControls(
    infoAttributes,
    (attribute) => `${attribute.name} ${attribute.value}`,
    attributeFilters,
  );
  const [projects, setProjects] = useState(initialProjects);
  const projectControls = useTableControls(projects, (project) => project.name, []);
  const selectedProjectId =
    projectControls.selectedIds.size === 1 ? [...projectControls.selectedIds][0] : undefined;

  const deleteInfoAttributes = () => {
    setInfoAttributes((current) =>
      current.filter((attribute) => !infoControls.selectedIds.has(attribute.id)),
    );
    infoControls.setSelectedIds(new Set());
  };

  const deleteProject = () => {
    if (!selectedProjectId) return;
    setProjects((current) => current.filter((project) => project.id !== selectedProjectId));
    projectControls.setSelectedIds(new Set());
  };

  return (
    <>
      <PageHeader title="My profile" />
      <div className="d-grid gap-3">
        <ContentSection
          title="Me"
          actions={
            <Button
              variant="outline-secondary"
              disabled={meControls.selectedIds.size !== 1}
              onClick={() => navigate("me/edit")}
            >
              Edit attribute
            </Button>
          }
        >
          <DataTable
            rows={meAttributes}
            columns={attributeColumns}
            selectedIds={meControls.selectedIds}
            onSelectionChange={meControls.setSelectedIds}
          />
        </ContentSection>

        <ContentSection title="Info">
          <ListToolbar
            search={infoControls.search}
            onSearchChange={infoControls.setSearch}
            searchLabel="Search profile attributes"
            filter={{
              labels: attributeFilters.map((filter) => filter.label),
              index: infoControls.filterIndex,
              onChange: infoControls.setFilterIndex,
            }}
            actions={
              <>
                <Button variant="outline-secondary" onClick={() => navigate("attributes/add")}>
                  Add attribute
                </Button>
                <Button
                  variant="outline-danger"
                  disabled={infoControls.selectedIds.size === 0}
                  onClick={deleteInfoAttributes}
                >
                  Delete attribute
                </Button>
              </>
            }
          />
          <DataTable
            rows={infoControls.visibleRows}
            columns={attributeColumns}
            selectedIds={infoControls.selectedIds}
            onSelectionChange={infoControls.setSelectedIds}
          />
        </ContentSection>

        <ContentSection
          title="Projects"
          actions={
            <>
              <Button variant="success" onClick={() => navigate("projects/new")}>
                Add
              </Button>
              <Button
                variant="outline-secondary"
                disabled={!selectedProjectId}
                onClick={() => selectedProjectId && navigate(`projects/${selectedProjectId}/edit`)}
              >
                Edit
              </Button>
              <Button variant="outline-danger" disabled={!selectedProjectId} onClick={deleteProject}>
                Delete
              </Button>
            </>
          }
        >
          <DataTable
            rows={projects}
            columns={projectColumns}
            selectedIds={projectControls.selectedIds}
            onSelectionChange={projectControls.setSelectedIds}
          />
        </ContentSection>
      </div>
    </>
  );
}
