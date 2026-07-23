import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { EntityCreatePage } from "../../shared/ui/EntityCreatePage";
import { AttributeForm, type AttributeFormValue } from "./AttributeForm";
import { createAttribute } from "./attributes.api";

const initialValue: AttributeFormValue = {
  name: "",
  description: "",
  type: "",
  category: "",
  optionsText: "",
};

function parseOptions(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
}

export function CreateAttributePage() {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const submitAttribute = async () => {
    if (!value.type || !value.category) {
      setErrorMessage("Select Attribute type and category");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await createAttribute({
        name: value.name,
        description: value.description,
        type: value.type,
        category: value.category,
        ...(value.type === "SINGLE_SELECT"
          ? { options: parseOptions(value.optionsText) }
          : {}),
      });
      navigate("/recruiter/attributes");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to create Attribute"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EntityCreatePage
      title="Create attribute"
      listLabel="View attributes"
      listPath="/recruiter/attributes"
      createLabel="Create attribute"
      submitLabel="Create attribute"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={submitAttribute}
    >
      <AttributeForm
        value={value}
        onChange={setValue}
        disabled={isSubmitting}
      />
    </EntityCreatePage>
  );
}
