import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { EntityCreatePage } from "../../shared/ui/EntityCreatePage";
import { ProjectForm, type ProjectFormValue } from "./ProjectForm";
import { createProject } from "./projects.api";

const initialValue: ProjectFormValue = {
  name: "",
  periodStart: "",
  periodEnd: "",
  description: "",
  tagsText: "",
};

function parseTags(tagsText: string): string[] {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const profilePath = candidateId
    ? `/admin/candidates/${candidateId}/profile`
    : "/candidate/profile";
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const submit = async () => {
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await createProject({
        name: value.name,
        periodStart: value.periodStart,
        periodEnd: value.periodEnd || null,
        description: value.description,
        tags: parseTags(value.tagsText),
      }, { candidateId });
      navigate(profilePath);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to create Project"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EntityCreatePage
      title="Create project"
      listLabel="Back to profile"
      listPath={profilePath}
      createLabel="Create project"
      submitLabel="Create project"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    >
      <ProjectForm
        value={value}
        onChange={setValue}
        disabled={isSubmitting}
      />
    </EntityCreatePage>
  );
}
