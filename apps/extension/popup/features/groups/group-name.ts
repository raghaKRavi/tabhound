/** Name used when the user leaves the group name blank: the site of the first selected tab. */
export function defaultGroupName(url: string | undefined): string {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '') || 'Tabhound';
  } catch {
    return 'Tabhound';
  }
}
