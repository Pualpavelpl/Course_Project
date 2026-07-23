import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ProjectForm, type ProjectFormValue } from "./ProjectForm";
import { getMyProject, updateProject } from "./projects.api";

export function EditProjectPage() {
  const { projectId, candidateId } = useParams();
  const navigate = useNavigate();
  const profilePath = candidateId
    ? `/admin/candidates/${candidateId}/profile`
    : "/candidate/profile";
  const [value, setValue] = useState<ProjectFormValue>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProject() {
      if (!projectId) {
        setErrorMessage("Project id is missing");
        setIsLoading(false);
        return;
      }

      try {
        const project = await getMyProject(
          projectId,
          abortController.signal,
          { candidateId },
        );
        setValue({
          name: project.name,
          periodStart: project.periodStart,
          periodEnd: project.periodEnd ?? "",
          description: project.description,
          tagsText: project.tags.map(({ name }) => name).join(", "),
        });
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Project"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadProject();
    return () => abortController.abort();
  }, [candidateId, projectId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId || !value) return;

    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await updateProject(projectId, {
        name: value.name,
        periodStart: value.periodStart,
        periodEnd: value.periodEnd || null,
        description: value.description,
        tags: value.tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }, { candidateId });
      navigate(profilePath);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to update Project"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Edit project" />
      {isLoading ? <Alert variant="info">Loading Project...</Alert> : null}
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      {value ? (
        <Form onSubmit={submit}>
          <div className="d-grid gap-3">
            <ProjectForm
              value={value}
              onChange={setValue}
              disabled={isSubmitting}
            />
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => navigate(profilePath)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </Form>
      ) : null}
    </>
  );
}
