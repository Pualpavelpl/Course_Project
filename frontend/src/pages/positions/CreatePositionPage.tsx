import { useEffect, useState } from "react";
import { Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../shared/api/apiClient";
import type { FilterOption } from "../../shared/hooks/useTableControls";
import type { TableColumn } from "../../shared/ui/DataTable";
import { EntityCreatePage } from "../../shared/ui/EntityCreatePage";
import { SelectableListSection } from "../../shared/ui/SelectableListSection";
import {
  attributeCategories,
  attributeCategoryLabels,
  getAttribute,
  type AttributeCategory,
  type AttributeDetail,
  type AttributeListItem,
} from "../attributes/attributes.api";
import { OrderedAttributeSelection } from "./OrderedAttributeSelection";
import {
  PositionFieldsCard,
  type PositionFormValue,
} from "./PositionFieldsCard";
import {
  createPosition,
  type TagListItem,
} from "./positions.api";
import {
  useAttributeSuggestions,
  useTagSuggestions,
} from "./usePositionSuggestions";

const initialValue: PositionFormValue = {
  name: "",
  description: "",
  maxProjects: 3,
  isPublic: true,
  accessAttributeId: "",
  accessOperator: "",
  accessOptionId: "",
  accessValue: "",
  customTags: "",
};

const attributeColumns: TableColumn<AttributeListItem>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  {
    key: "category",
    header: "Category",
    render: (attribute) => attributeCategoryLabels[attribute.category],
  },
];

const attributeFilters: FilterOption<AttributeListItem>[] =
  attributeCategories.map((category) => ({
    label: attributeCategoryLabels[category],
    matches: (attribute) => attribute.category === category,
  }));

const tagColumns: TableColumn<TagListItem>[] = [
  { key: "name", header: "Name", render: (tag) => tag.name },
  {
    key: "updatedAt",
    header: "Updated",
    render: (tag) => new Intl.DateTimeFormat().format(new Date(tag.updatedAt)),
  },
];

function parseCustomTags(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function CreatePositionPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const [selectedAttributes, setSelectedAttributes] = useState<
    AttributeListItem[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<TagListItem[]>([]);
  const [attributeFilterIndex, setAttributeFilterIndex] =
    useState<number>();
  const [accessAttribute, setAccessAttribute] =
    useState<AttributeDetail>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const attributeCategory: AttributeCategory | undefined =
    attributeFilterIndex === undefined
      ? undefined
      : attributeCategories[attributeFilterIndex];
  const attributeSuggestions =
    useAttributeSuggestions(attributeCategory);
  const tagSuggestions = useTagSuggestions();

  useEffect(() => {
    const abortController = new AbortController();

    async function loadAccessAttribute() {
      if (!value.accessAttributeId) {
        setAccessAttribute(undefined);
        return;
      }

      try {
        setAccessAttribute(
          await getAttribute(
            value.accessAttributeId,
            abortController.signal,
          ),
        );
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load access Attribute",
            ),
          );
        }
      }
    }

    void loadAccessAttribute();
    return () => abortController.abort();
  }, [value.accessAttributeId]);

  const changeAttributeSelection = (ids: Set<string>) => {
    setSelectedAttributes((current) => {
      const retained = current.filter((attribute) => ids.has(attribute.id));
      const retainedIds = new Set(
        retained.map((attribute) => attribute.id),
      );
      const added = attributeSuggestions.rows.filter(
        (attribute) =>
          ids.has(attribute.id) && !retainedIds.has(attribute.id),
      );

      return [...retained, ...added];
    });

    if (value.accessAttributeId && !ids.has(value.accessAttributeId)) {
      setValue((current) => ({
        ...current,
        accessAttributeId: "",
        accessOperator: "",
        accessOptionId: "",
        accessValue: "",
      }));
    }
  };

  const changeTagSelection = (ids: Set<string>) => {
    setSelectedTags((current) => {
      const retained = current.filter((tag) => ids.has(tag.id));
      const retainedIds = new Set(retained.map((tag) => tag.id));
      const added = tagSuggestions.rows.filter(
        (tag) => ids.has(tag.id) && !retainedIds.has(tag.id),
      );

      return [...retained, ...added];
    });
  };

  const moveAttribute = (index: number, direction: -1 | 1) => {
    setSelectedAttributes((current) => {
      const next = [...current];
      const targetIndex = index + direction;
      const selected = next[index];
      const target = next[targetIndex];

      if (!selected || !target) {
        return current;
      }

      next[index] = target;
      next[targetIndex] = selected;
      return next;
    });
  };

  const submitPosition = async () => {
    if (selectedAttributes.length === 0) {
      setErrorMessage("Select at least one Attribute");
      return;
    }

    if (
      !value.isPublic &&
      (!accessAttribute || !value.accessOperator)
    ) {
      setErrorMessage("Complete the Position access rule");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await createPosition({
        name: value.name,
        description: value.description,
        maxProjects: value.maxProjects,
        attributeIds: selectedAttributes.map((attribute) => attribute.id),
        tags: [
          ...selectedTags.map((tag) => tag.name),
          ...parseCustomTags(value.customTags),
        ],
        isPublic: value.isPublic,
        ...(!value.isPublic && accessAttribute && value.accessOperator
          ? {
              accessRule: {
                attributeId: accessAttribute.id,
                operator: value.accessOperator,
                ...(accessAttribute.type === "SINGLE_SELECT"
                  ? { optionId: value.accessOptionId }
                  : { value: value.accessValue }),
              },
            }
          : {}),
      });
      navigate("/recruiter/positions");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to create Position"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EntityCreatePage
      title="Create position"
      listLabel="View positions"
      listPath="/recruiter/positions"
      createLabel="Create position"
      submitLabel="Create position"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={submitPosition}
    >
      <PositionFieldsCard
        value={value}
        onChange={setValue}
        selectedAttributes={selectedAttributes}
        accessAttribute={accessAttribute}
        disabled={isSubmitting}
      />

      <SelectableListSection
        title="Attributes"
        rows={attributeSuggestions.rows}
        columns={attributeColumns}
        getSearchText={(attribute) =>
          `${attribute.name} ${attribute.category}`
        }
        filterOptions={attributeFilters}
        selectedIds={
          new Set(selectedAttributes.map((attribute) => attribute.id))
        }
        onSelectionChange={changeAttributeSelection}
        remote={{
          search: attributeSuggestions.search,
          filterIndex: attributeFilterIndex,
          isLoading: attributeSuggestions.isLoading,
          errorMessage: attributeSuggestions.errorMessage,
          onSearchChange: attributeSuggestions.setSearch,
          onFilterChange: (index) => {
            setAttributeFilterIndex(index);
            attributeSuggestions.setPage(1);
          },
          pagination: {
            page: attributeSuggestions.page,
            totalPages: attributeSuggestions.totalPages,
            onChange: attributeSuggestions.setPage,
          },
        }}
      />

      <OrderedAttributeSelection
        attributes={selectedAttributes}
        onMove={moveAttribute}
        disabled={isSubmitting}
      />

      <SelectableListSection
        title="Project tags"
        rows={tagSuggestions.rows}
        columns={tagColumns}
        getSearchText={(tag) => tag.name}
        filterOptions={[]}
        selectedIds={new Set(selectedTags.map((tag) => tag.id))}
        onSelectionChange={changeTagSelection}
        remote={{
          search: tagSuggestions.search,
          filterIndex: undefined,
          isLoading: tagSuggestions.isLoading,
          errorMessage: tagSuggestions.errorMessage,
          onSearchChange: tagSuggestions.setSearch,
          onFilterChange: () => undefined,
          pagination: {
            page: tagSuggestions.page,
            totalPages: tagSuggestions.totalPages,
            onChange: tagSuggestions.setPage,
          },
        }}
      />

      <Card>
        <Card.Body>
          <Form.Group controlId="positionCustomTags">
            <Form.Label>Additional tags</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={value.customTags}
              onChange={(event) =>
                setValue({ ...value, customTags: event.target.value })
              }
              disabled={isSubmitting}
              placeholder="Enter comma-separated tag names"
            />
          </Form.Group>
        </Card.Body>
      </Card>
    </EntityCreatePage>
  );
}
