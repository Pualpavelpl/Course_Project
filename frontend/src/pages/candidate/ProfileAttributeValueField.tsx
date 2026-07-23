import { Form } from "react-bootstrap";
import type {
  AttributeOption,
  AttributeType,
} from "../attributes/attributes.api";
import type { ProfileAttributeValueInput } from "./profile.api";

interface ProfileAttributeValueFieldProps {
  type: AttributeType;
  options: AttributeOption[];
  value: ProfileAttributeValueInput;
  onChange: (value: ProfileAttributeValueInput) => void;
  disabled?: boolean | undefined;
  showLabel?: boolean | undefined;
}

function getPeriodParts(value?: string): [string, string] {
  const [start = "", end = ""] = value?.split("/", 2) ?? [];
  return [start, end];
}

export function ProfileAttributeValueField({
  type,
  options,
  value,
  onChange,
  disabled = false,
  showLabel = true,
}: ProfileAttributeValueFieldProps) {
  if (type === "SINGLE_SELECT") {
    return (
      <Form.Group controlId="profileAttributeOption">
        {showLabel ? <Form.Label>Value</Form.Label> : null}
        <Form.Select
          value={value.optionId ?? ""}
          onChange={(event) =>
            onChange({ optionId: event.target.value || undefined })
          }
          disabled={disabled}
          required
        >
          <option value="" disabled>Select a value</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.value}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    );
  }

  if (type === "BOOLEAN") {
    return (
      <Form.Group controlId="profileAttributeBoolean">
        {showLabel ? <Form.Label>Value</Form.Label> : null}
        <Form.Select
          value={value.value ?? ""}
          onChange={(event) =>
            onChange({ value: event.target.value || undefined })
          }
          disabled={disabled}
          required
        >
          <option value="" disabled>Select a value</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </Form.Select>
      </Form.Group>
    );
  }

  if (type === "PERIOD") {
    const [start, end] = getPeriodParts(value.value);
    const updatePeriod = (nextStart: string, nextEnd: string) =>
      onChange({ value: `${nextStart}/${nextEnd}` });

    return (
      <div className="row g-3">
        <Form.Group className="col-md-6" controlId="profileAttributePeriodStart">
          {showLabel ? <Form.Label>Period start</Form.Label> : null}
          <Form.Control
            type="date"
            value={start}
            onChange={(event) => updatePeriod(event.target.value, end)}
            disabled={disabled}
            required
          />
        </Form.Group>
        <Form.Group className="col-md-6" controlId="profileAttributePeriodEnd">
          {showLabel ? <Form.Label>Period end</Form.Label> : null}
          <Form.Control
            type="date"
            value={end}
            min={start || undefined}
            onChange={(event) => updatePeriod(start, event.target.value)}
            disabled={disabled}
            required
          />
        </Form.Group>
      </div>
    );
  }

  return (
    <Form.Group controlId="profileAttributeValue">
      {showLabel ? <Form.Label>Value</Form.Label> : null}
      <Form.Control
        type={type === "NUMBER" ? "number" : type === "DATE" ? "date" : "text"}
        step={type === "NUMBER" ? "any" : undefined}
        value={value.value ?? ""}
        onChange={(event) =>
          onChange({ value: event.target.value || undefined })
        }
        disabled={disabled}
        maxLength={1_000}
        required
      />
    </Form.Group>
  );
}
