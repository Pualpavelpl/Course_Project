import { useEffect, useState } from "react";

export function useDebouncedValue<Value>(
  value: Value,
  delayMilliseconds = 300,
): Value {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMilliseconds);

    return () => window.clearTimeout(timeoutId);
  }, [delayMilliseconds, value]);

  return debouncedValue;
}
