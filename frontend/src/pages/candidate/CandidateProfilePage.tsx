import { useEffect, useState } from "react";
import { Alert, Badge, Button } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getStoredAuthUser } from "../../shared/api/authApi";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import type { FilterOption } from "../../shared/hooks/useTableControls";
import { useTableControls } from "../../shared/hooks/useTableControls";
import { ContentSection } from "../../shared/ui/ContentSection";
import { DataTable, type TableColumn } from "../../shared/ui/DataTable";
import { ExpandableText } from "../../shared/ui/ExpandableText";
import { ListToolbar } from "../../shared/ui/ListToolbar";
import { MarkdownText } from "../../shared/ui/MarkdownText";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  attributeCategories,
  attributeCategoryLabels,
} from "../attributes/attributes.api";
import {
  deleteProfileAttribute,
  getMyProfile,
  type CandidateProfile,
  type ProfileAttribute,
} from "./profile.api";
import {
  deleteProject as deleteProjectRequest,
  listMyProjects,
  type CandidateProject,
} from "./projects.api";
import { getCandidatePagePermissions } from "./candidatePermissions";

const attributeColumns: TableColumn<ProfileAttribute>[] = [
  { key: "name", header: "Attribute", render: (attribute) => attribute.name },
  {
    key: "value",
    header: "Value",
    render: (attribute) => attribute.displayValue,
  },
  {
    key: "category",
    header: "Category",
    render: (attribute) => attributeCategoryLabels[attribute.category],
  },
];

const attributeFilters: FilterOption<ProfileAttribute>[] =
  attributeCategories.map((category) => ({
    label: attributeCategoryLabels[category],
    matches: (attribute) => attribute.category === category,
  }));

function formatProjectPeriod(project: CandidateProject): string {
  return project.periodEnd
    ? `${project.periodStart} – ${project.periodEnd}`
    : `${project.periodStart} – Present`;
}

const projectColumns: TableColumn<CandidateProject>[] = [
  { key: "name", header: "Name", render: (project) => project.name },
  {
    key: "period",
    header: "Period",
    render: formatProjectPeriod,
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
    render: (project) => (
      <div className="d-flex flex-wrap gap-1">
        {project.tags.map((tag) => (
          <Badge key={tag.id} bg="secondary">{tag.name}</Badge>
        ))}
      </div>
    ),
  },
];

export function CandidateProfilePage() {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const permissions = getCandidatePagePermissions(
    getStoredAuthUser()?.role ?? "CANDIDATE",
  );
  const [profile, setProfile] = useState<CandidateProfile>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const meAttributes = profile?.meAttributes ?? [];
  const infoAttributes = profile?.infoAttributes ?? [];
  const meControls = useTableControls(
    meAttributes,
    (attribute) => attribute.name,
    [],
  );
  const infoControls = useTableControls(
    infoAttributes,
    (attribute) => `${attribute.name} ${attribute.displayValue}`,
    attributeFilters,
  );
  const [projects, setProjects] = useState<CandidateProject[]>([]);
  const projectControls = useTableControls(
    projects,
    (project) => project.name,
    [],
  );
  const selectedMeRowId =
    meControls.selectedIds.size === 1
      ? [...meControls.selectedIds][0]
      : undefined;
  const selectedInfoRowId =
    infoControls.selectedIds.size === 1
      ? [...infoControls.selectedIds][0]
      : undefined;
  const selectedMeAttribute = meAttributes.find(
    ({ id }) => id === selectedMeRowId,
  );
  const selectedInfoAttribute = infoAttributes.find(
    ({ id }) => id === selectedInfoRowId,
  );
  const selectedProjectId =
    projectControls.selectedIds.size === 1
      ? [...projectControls.selectedIds][0]
      : undefined;

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage(undefined);

      try {
        const [profileResponse, projectResponse] = await Promise.all([
          getMyProfile(abortController.signal, { candidateId }),
          listMyProjects(abortController.signal, { candidateId }),
        ]);
        setProfile(profileResponse);
        setProjects(projectResponse);
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Candidate Profile"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => abortController.abort();
  }, [candidateId]);

  const deleteInfoValue = async () => {
    if (!profile || !selectedInfoAttribute) return;
    setErrorMessage(undefined);

    try {
      await deleteProfileAttribute(
        profile.version,
        selectedInfoAttribute.attributeId,
        { candidateId },
      );
      setProfile({
        ...profile,
        version: profile.version + 1,
        infoAttributes: profile.infoAttributes.filter(
          ({ attributeId }) =>
            attributeId !== selectedInfoAttribute.attributeId,
        ),
      });
      infoControls.setSelectedIds(new Set());
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to delete Profile Attribute"),
      );
    }
  };

  const deleteProject = async () => {
    if (!selectedProjectId) return;
    setErrorMessage(undefined);

    try {
      await deleteProjectRequest(selectedProjectId, { candidateId });
      setProjects((current) =>
        current.filter((project) => project.id !== selectedProjectId),
      );
      projectControls.setSelectedIds(new Set());
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete Project"));
    }
  };

  return (
    <>
      <PageHeader title={candidateId ? "Candidate profile" : "My profile"} />
      {isLoading ? <Alert variant="info">Loading Candidate Profile...</Alert> : null}
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      <div className="d-grid gap-3">
        <ContentSection
          title="Me"
          actions={
            <Button
              variant="outline-secondary"
              disabled={!selectedMeAttribute || !permissions.canEditProfile}
              onClick={() =>
                selectedMeAttribute &&
                navigate(
                  `attributes/${selectedMeAttribute.attributeId}/edit`,
                )
              }
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
            emptyMessage="No built-in Profile Attributes"
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
                <Button
                  variant="outline-secondary"
                  disabled={!permissions.canEditProfile}
                  onClick={() => navigate("attributes/add")}
                >
                  Add attribute
                </Button>
                <Button
                  variant="outline-secondary"
                  disabled={
                    !selectedInfoAttribute || !permissions.canEditProfile
                  }
                  onClick={() =>
                    selectedInfoAttribute &&
                    navigate(
                      `attributes/${selectedInfoAttribute.attributeId}/edit`,
                    )
                  }
                >
                  Edit attribute
                </Button>
                <Button
                  variant="outline-danger"
                  disabled={
                    !selectedInfoAttribute || !permissions.canEditProfile
                  }
                  onClick={() => void deleteInfoValue()}
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
            emptyMessage="No Info Attributes"
          />
        </ContentSection>

        <ContentSection
          title="Projects"
          actions={
            <>
              <Button
                variant="success"
                disabled={!permissions.canEditProfile}
                onClick={() => navigate("projects/new")}
              >
                Add
              </Button>
              <Button
                variant="outline-secondary"
                disabled={!selectedProjectId || !permissions.canEditProfile}
                onClick={() =>
                  selectedProjectId &&
                  navigate(`projects/${selectedProjectId}/edit`)
                }
              >
                Edit
              </Button>
              <Button
                variant="outline-danger"
                disabled={!selectedProjectId || !permissions.canEditProfile}
                onClick={() => void deleteProject()}
              >
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
