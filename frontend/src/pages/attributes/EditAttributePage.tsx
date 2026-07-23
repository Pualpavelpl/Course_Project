import { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { EntityCreatePage } from "../../shared/ui/EntityCreatePage";
import { AttributeForm, type AttributeFormValue } from "./AttributeForm";
import {
  getAttribute,
  updateAttribute,
  updateBuiltinAttribute,
  type AttributeDetail,
} from "./attributes.api";

function toFormValue(attribute: AttributeDetail): AttributeFormValue {
  return {
    name: attribute.name,
    description: attribute.description,
    type: attribute.type,
    category: attribute.category,
    optionsText: attribute.options.map((option) => option.value).join("\n"),
  };
}

function parseOptions(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean);
}

export function EditAttributePage() {
  const navigate = useNavigate();
  const { attributeId } = useParams();
  const [attribute, setAttribute] = useState<AttributeDetail>();
  const [value, setValue] = useState<AttributeFormValue>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadAttribute() {
      if (!attributeId) {
        setErrorMessage("Attribute id is missing");
        setIsLoading(false);
        return;
      }

      try {
        const response = await getAttribute(
          attributeId,
          abortController.signal,
        );

        setAttribute(response);
        setValue(toFormValue(response));
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Attribute"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadAttribute();
    return () => abortController.abort();
  }, [attributeId]);

  const submitAttribute = async () => {
    if (!attributeId || !attribute || !value) {
      return;
    }

    if (!value.type || !value.category) {
      setErrorMessage("Select Attribute type and category");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      if (attribute.isBuiltin) {
        await updateBuiltinAttribute(
          attributeId,
          attribute.version,
          value.description,
        );
      } else {
        await updateAttribute(attributeId, {
          version: attribute.version,
          name: value.name,
          description: value.description,
          type: value.type,
          category: value.category,
          ...(value.type === "SINGLE_SELECT"
            ? { options: parseOptions(value.optionsText) }
            : {}),
        });
      }

      navigate("/recruiter/attributes");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to update Attribute"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EntityCreatePage
      title="Edit attribute"
      listLabel="View attributes"
      listPath="/recruiter/attributes"
      createLabel="Edit attribute"
      submitLabel="Save changes"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      submitDisabled={isLoading || !value}
      onSubmit={submitAttribute}
    >
      {isLoading ? <Alert variant="info">Loading Attribute...</Alert> : null}
      {!isLoading && value ? (
        <AttributeForm
          value={value}
          onChange={setValue}
          protectedStructure={attribute?.isBuiltin}
          disabled={isSubmitting}
        />
      ) : null}
    </EntityCreatePage>
  );
}
