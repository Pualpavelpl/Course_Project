import { useEffect, useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ProfileAttributeValueField } from "./ProfileAttributeValueField";
import {
  getMyProfile,
  updateProfileAttribute,
  type ProfileAttribute,
  type ProfileAttributeValueInput,
} from "./profile.api";

export function EditProfileAttributePage() {
  const { attributeId, candidateId } = useParams();
  const navigate = useNavigate();
  const profilePath = candidateId
    ? `/admin/candidates/${candidateId}/profile`
    : "/candidate/profile";
  const [attribute, setAttribute] = useState<ProfileAttribute>();
  const [profileVersion, setProfileVersion] = useState<number>();
  const [value, setValue] = useState<ProfileAttributeValueInput>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadAttribute() {
      try {
        const profile = await getMyProfile(abortController.signal, {
          candidateId,
        });
        const profileAttribute = [
          ...profile.meAttributes,
          ...profile.infoAttributes,
        ].find((item) => item.attributeId === attributeId);

        if (!profileAttribute) {
          setErrorMessage("Profile Attribute not found");
          return;
        }

        setAttribute(profileAttribute);
        setProfileVersion(profile.version);
        setValue(
          profileAttribute.type === "SINGLE_SELECT"
            ? { optionId: profileAttribute.optionId ?? undefined }
            : { value: profileAttribute.value ?? undefined },
        );
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load Profile Attribute"),
          );
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false);
      }
    }

    void loadAttribute();
    return () => abortController.abort();
  }, [attributeId, candidateId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!attribute || profileVersion === undefined) return;
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await updateProfileAttribute(
        profileVersion,
        attribute.attributeId,
        value,
        { candidateId },
      );
      navigate(profilePath);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to update Profile Attribute"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Edit profile attribute" />
      {isLoading ? <Alert variant="info">Loading Profile Attribute...</Alert> : null}
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      {attribute ? (
        <Form onSubmit={submit}>
          <Card>
            <Card.Body className="d-grid gap-3">
              <div>
                <h2 className="h5 mb-1">{attribute.name}</h2>
                <p className="text-secondary mb-0">{attribute.description}</p>
              </div>
              <ProfileAttributeValueField
                type={attribute.type}
                options={attribute.options}
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
            </Card.Body>
          </Card>
        </Form>
      ) : null}
    </>
  );
}
