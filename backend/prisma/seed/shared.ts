import type { Prisma } from "../../src/generated/prisma/client.js";

export type TransactionClient = Prisma.TransactionClient;

export interface NamedRecord {
  id: string;
  name: string;
}

export function createNameMap<T extends NamedRecord>(
  records: T[],
): Map<string, T> {
  return new Map(records.map((record) => [record.name, record]));
}

export function requireRecord<T>(
  records: Map<string, T>,
  name: string,
): T {
  const record = records.get(name);

  if (!record) {
    throw new Error(`Demo record is unavailable: ${name}`);
  }

  return record;
}
