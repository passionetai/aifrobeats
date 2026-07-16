export function newId(): string {
  return crypto.randomUUID();
}

// Turns "Olodo Uprising" into "olodo-uprising" for handles/slugs if needed.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
