/** Replaces {{placeholders}} in a ticket template; empty values become <placeholder name>. */
export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => values[k] || `<${k.replace(/_/g, ' ')}>`)
}
