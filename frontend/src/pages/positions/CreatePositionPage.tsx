import { Card, Form } from "react-bootstrap";
import type { FilterOption } from "../../shared/hooks/useTableControls";
import type { TableColumn } from "../../shared/ui/DataTable";
import { EntityCreatePage } from "../../shared/ui/EntityCreatePage";
import { SelectableListSection } from "../../shared/ui/SelectableListSection";
import {
  attributeCategories,
  initialAttributes,
  type AttributeListItem,
} from "../attributes/attributes.mock";
import { initialTags, type TagListItem } from "./tags.mock";

const attributeColumns: TableColumn<AttributeListItem>[] = [
  { key: "name", header: "Name", render: (attribute) => attribute.name },
  { key: "type", header: "Type", render: (attribute) => attribute.type },
  { key: "category", header: "Category", render: (attribute) => attribute.category },
];

const attributeFilters: FilterOption<AttributeListItem>[] = attributeCategories.map((category) => ({
  label: category,
  matches: (attribute) => attribute.category === category,
}));

const tagColumns: TableColumn<TagListItem>[] = [
  { key: "name", header: "Name", render: (tag) => tag.name },
  { key: "createdAt", header: "Created", render: (tag) => tag.createdAt },
  { key: "updatedAt", header: "Updated", render: (tag) => tag.updatedAt },
];

const tagFilters: FilterOption<TagListItem>[] = [
  { label: "Recently updated", matches: (tag) => tag.updatedAt >= "2026-07-18" },
];

export function CreatePositionPage() {
  return (
    <EntityCreatePage
      title="Create position"
      listLabel="View positions"
      listPath="/recruiter/positions"
      createLabel="Create position"
      submitLabel="Create position"
    >
      <Card>
        <Card.Body className="d-grid gap-3">
          <Form.Group controlId="positionName">
            <Form.Label>Name</Form.Label>
            <Form.Control required />
          </Form.Group>
          <Form.Group controlId="positionDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} required />
          </Form.Group>
          <div className="row g-3">
            <Form.Group className="col-md-6" controlId="positionAccess">
              <Form.Label>Access</Form.Label>
              <Form.Select defaultValue="PUBLIC">
                <option value="PUBLIC">Public</option>
                <option value="RESTRICTED">Restricted</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="col-md-6" controlId="positionMaxProjects">
              <Form.Label>Maximum projects in CV</Form.Label>
              <Form.Control type="number" min={0} defaultValue={3} />
            </Form.Group>
          </div>
        </Card.Body>
      </Card>

      <SelectableListSection
        title="Attributes"
        rows={initialAttributes}
        columns={attributeColumns}
        getSearchText={(attribute) => `${attribute.name} ${attribute.category}`}
        filterOptions={attributeFilters}
      />

      <SelectableListSection
        title="Project tags"
        rows={initialTags}
        columns={tagColumns}
        getSearchText={(tag) => tag.name}
        filterOptions={tagFilters}
      />
    </EntityCreatePage>
  );
}
