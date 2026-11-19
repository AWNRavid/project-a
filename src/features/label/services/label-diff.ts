export interface LabelRef {
  id: string;
  name: string;
}

/**
 * Returns the labels added and removed between two sets. Order is kept
 * from each input so activity rows follow the user's selection order.
 */
export function diffIssueLabels(
  current: LabelRef[],
  next: LabelRef[],
): { added: LabelRef[]; removed: LabelRef[] } {
  const currentIds = new Set(current.map((label) => label.id));
  const nextIds = new Set(next.map((label) => label.id));

  return {
    added: next.filter((label) => !currentIds.has(label.id)),
    removed: current.filter((label) => !nextIds.has(label.id)),
  };
}
