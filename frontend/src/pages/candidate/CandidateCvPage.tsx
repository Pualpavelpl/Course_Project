import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Tab, Tabs } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStoredAuthUser } from "../../shared/api/authApi";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { ContentSection } from "../../shared/ui/ContentSection";
import type { TableColumn } from "../../shared/ui/DataTable";
import { ExpandableText } from "../../shared/ui/ExpandableText";
import { MarkdownText } from "../../shared/ui/MarkdownText";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SearchableTable } from "../../shared/ui/SearchableTable";
import { attributeCategoryLabels } from "../attributes/attributes.api";
import {
  deleteCv,
  getCandidateCv,
  likeCv,
  saveCvProfileAttributes,
  unlikeCv,
  type CvAttribute,
  type CvDetail,
} from "../cvs/cvs.api";
import { ProfileAttributeValueField } from "./ProfileAttributeValueField";
import type { ProfileAttributeValueInput } from "./profile.api";
import type { CandidateProject } from "./projects.api";
import { getCandidatePagePermissions } from "./candidatePermissions";

function formatProjectPeriod(project: CandidateProject): string {
  return project.periodEnd
    ? `${project.periodStart} – ${project.periodEnd}`
    : `${project.periodStart} – Present`;
}

const projectColumns: TableColumn<CandidateProject>[] = [
  { key: "name", header: "Name", render: (project) => project.name },
  { key: "period", header: "Period", render: formatProjectPeriod },
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
    render: (project) => project.tags.map((tag) => (
      <Badge key={tag.id} bg="secondary" className="me-1">{tag.name}</Badge>
    )),
  },
];

function createDraftValue(attribute: CvAttribute): ProfileAttributeValueInput {
  return attribute.type === "SINGLE_SELECT"
    ? { optionId: attribute.optionId ?? undefined }
    : { value: attribute.value ?? undefined };
}

export function CandidateCvPage() {
  const { cvId, candidateId } = useParams();
  const navigate = useNavigate();
  const permissions = getCandidatePagePermissions(
    getStoredAuthUser()?.role ?? "CANDIDATE",
  );
  const [cv, setCv] = useState<CvDetail>();
  const [draftValues, setDraftValues] = useState<
    Record<string, ProfileAttributeValueInput>
  >({});
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCv() {
      if (!cvId) {
        setErrorMessage("CV id is missing");
        setIsLoading(false);
        return;
      }

      try {
        const response = await getCandidateCv(
          cvId,
          abortController.signal,
          candidateId,
        );
        setCv(response);
        setDraftValues(Object.fromEntries(
          response.attributes.map((attribute) => [
            attribute.attributeId,
            createDraftValue(attribute),
          ]),
        ));
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
  }, [candidateId, cvId]);

  const updateDraft = (
    attributeId: string,
    value: ProfileAttributeValueInput,
  ) => {
    setDraftValues((current) => ({ ...current, [attributeId]: value }));
    setChangedIds((current) => new Set(current).add(attributeId));
    setSuccessMessage(undefined);
  };

  const attributeColumns = useMemo<TableColumn<CvAttribute>[]>(() => [
    { key: "name", header: "Name", render: (attribute) => attribute.name },
    {
      key: "category",
      header: "Category",
      render: (attribute) => attributeCategoryLabels[attribute.category],
    },
    {
      key: "value",
      header: "Value",
      render: (attribute) => (
        <ProfileAttributeValueField
          type={attribute.type}
          options={attribute.options}
          value={draftValues[attribute.attributeId] ?? {}}
          onChange={(value) => updateDraft(attribute.attributeId, value)}
          disabled={isSaving || !permissions.canEditCv}
          showLabel={false}
        />
      ),
    },
  ], [draftValues, isSaving, permissions.canEditCv]);

  const publishChanges = async () => {
    if (!cv || changedIds.size === 0) return;
    setIsSaving(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const updatedCv = await saveCvProfileAttributes(
        cv.id,
        cv.profile.version,
        [...changedIds].map((attributeId) => ({
          attributeId,
          ...draftValues[attributeId],
        })),
        candidateId,
      );
      setCv(updatedCv);
      setChangedIds(new Set());
      setSuccessMessage("CV changes were saved to your Profile.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to save CV changes"));
    } finally {
      setIsSaving(false);
    }
  };

  const removeCv = async () => {
    if (!cv) return;
    setIsDeleting(true);
    setErrorMessage(undefined);

    try {
      await deleteCv(cv.id, candidateId);
      navigate(
        candidateId
          ? `/admin/candidates/${candidateId}/profile`
          : "/candidate/cvs",
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to delete CV"));
      setIsDeleting(false);
    }
  };

  if (isLoading) return <Alert variant="info">Loading CV...</Alert>;
  if (!cv) {
    return (
      <Alert variant="warning">
        {errorMessage ?? "CV not found"}.{" "}
        <Link
          to={
            candidateId
              ? `/admin/candidates/${candidateId}/profile`
              : "/candidate/cvs"
          }
        >
          Return
        </Link>
      </Alert>
    );
  }

  const meAttributes = cv.attributes.filter(({ isBuiltin }) => isBuiltin);
  const infoAttributes = cv.attributes.filter(({ isBuiltin }) => !isBuiltin);
  const profilePath = candidateId
    ? `/admin/candidates/${candidateId}/profile`
    : "/candidate/profile";
  const positionPath = candidateId
    ? `/recruiter/positions/${cv.position.id}`
    : `/candidate/positions/${cv.position.id}`;

  const updateLike = async (shouldLike: boolean) => {
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      if (shouldLike) {
        await likeCv(cv.id);
        setSuccessMessage("CV was liked.");
      } else {
        await unlikeCv(cv.id);
        setSuccessMessage("CV like was removed.");
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update CV Like"));
    }
  };

  return (
    <>
      <PageHeader
        title={`${cv.position.name} CV`}
        actions={
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Link to={positionPath}>
              View position
            </Link>
            {permissions.canEditProfile ? (
              <Link to={profilePath}>Edit profile and projects</Link>
            ) : null}
            {permissions.canEditCv ? (
              <Button
                variant="success"
                disabled={isSaving || changedIds.size === 0}
                onClick={() => void publishChanges()}
              >
                {isSaving ? "Saving..." : "Publish"}
              </Button>
            ) : null}
            {permissions.canLikeCv ? (
              <>
                <Button
                  variant="outline-secondary"
                  onClick={() => void updateLike(false)}
                >
                  Remove like
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => void updateLike(true)}
                >
                  Like
                </Button>
              </>
            ) : null}
            {permissions.canDeleteCv ? (
              <Button
                variant="outline-danger"
                disabled={isDeleting}
                onClick={() => void removeCv()}
              >
                {isDeleting ? "Deleting..." : "Delete CV"}
              </Button>
            ) : null}
          </div>
        }
      />
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
      <ContentSection title="Me">
        <SearchableTable
          rows={meAttributes}
          columns={attributeColumns}
          getSearchText={(attribute) =>
            `${attribute.name} ${attribute.displayValue}`
          }
          searchLabel="Search personal attributes"
          emptyMessage="No personal Attributes in this Position template"
        />
      </ContentSection>

      <Tabs defaultActiveKey="projects" className="mt-4 mb-3">
        <Tab eventKey="projects" title="Project">
          <SearchableTable
            rows={cv.projects}
            columns={projectColumns}
            getSearchText={(project) =>
              `${project.name} ${project.description} ${project.tags
                .map(({ name }) => name)
                .join(" ")}`
            }
            searchLabel="Search CV projects"
            emptyMessage="No matching projects in this CV"
          />
        </Tab>
        <Tab eventKey="attributes" title="Attribute">
          <SearchableTable
            rows={infoAttributes}
            columns={attributeColumns}
            getSearchText={(attribute) =>
              `${attribute.name} ${attribute.displayValue} ${attribute.category}`
            }
            searchLabel="Search CV attributes"
            emptyMessage="No Info Attributes in this Position template"
          />
        </Tab>
        <Tab eventKey="tags" title="Tags">
          <SearchableTable
            rows={cv.tags}
            columns={[
              { key: "name", header: "Name", render: (tag) => tag.name },
            ]}
            getSearchText={(tag) => tag.name}
            searchLabel="Search CV tags"
            emptyMessage="No Position Tags"
          />
        </Tab>
      </Tabs>
    </>
  );
}
