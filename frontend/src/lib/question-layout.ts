// Question cards reserve room for the icon, disclosure, metadata and actual text.
// Wrapping is deliberately conservative so long questions keep their inner padding.
export function questionNodeHeight(text: string, width = 336) {
  const charsPerLine = Math.max(12, Math.floor((width - 112) / 8))
  let lines = 1, used = 0
  for (const word of text.split(/\s+/)) {
    if (used && used + word.length + 1 > charsPerLine) { lines++; used = 0 }
    lines += Math.max(0, Math.ceil(word.length / charsPerLine) - 1)
    used = word.length > charsPerLine ? word.length % charsPerLine : used + (used ? 1 : 0) + word.length
  }
  return Math.max(108, 36 + lines * 21 + 26)
}
