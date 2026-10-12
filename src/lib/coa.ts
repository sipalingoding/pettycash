/** Filter value for transactions that have no COA yet. */
export const NO_COA = "tanpa";

export type CoaOption = { code: string; name: string };

export function coaLabel(options: CoaOption[], code: string): string {
  const account = options.find((a) => a.code === code);
  return account ? `${account.code} - ${account.name}` : code;
}
