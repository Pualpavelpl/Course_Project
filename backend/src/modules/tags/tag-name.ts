export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeTagNames(names: string[]): string[] {
  const normalizedNames = names.map(normalizeTagName);
  const seenNames = new Set<string>();

  return normalizedNames.filter((name) => {
    const normalizedKey = name.toLowerCase();

    if (!name || seenNames.has(normalizedKey)) {
      return false;
    }

    seenNames.add(normalizedKey);
    return true;
  });
}
