const MARKER_RE = /\[(Manager request|Additional info|Handling note)\]\s*/g

const MARKER_TYPE = {
  'Manager request': 'manager-request',
  'Additional info': 'additional-info',
  'Handling note': 'handling-note',
}

export function parseIncidentDescription(description) {
  const text = description ?? ''
  const matches = [...text.matchAll(MARKER_RE)]

  if (matches.length === 0) {
    return { originalDescription: text.trim(), history: [] }
  }

  const originalDescription = text.slice(0, matches[0].index).trim()

  const history = matches.map((match, index) => {
    const contentStart = match.index + match[0].length
    const contentEnd = index + 1 < matches.length ? matches[index + 1].index : text.length
    return {
      type: MARKER_TYPE[match[1]],
      content: text.slice(contentStart, contentEnd).trim(),
    }
  })

  return { originalDescription, history }
}
