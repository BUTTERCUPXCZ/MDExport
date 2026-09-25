/** Title of a document: its first ATX heading (`# Title`), if any. */
export function documentTitle(markdown: string): string | null {
  const match = /^ {0,3}#{1,6}[ \t]+(.+?)[ \t#]*$/m.exec(markdown);
  return match ? match[1] : null;
}

export function wordCount(markdown: string): number {
  const words = markdown.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu);
  return words ? words.length : 0;
}
