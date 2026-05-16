export async function getApiErrorMessage(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      const data: { detail?: unknown; message?: unknown } = await response.json()
      if (typeof data.detail === 'string') {
        return data.detail
      }
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((item: { msg?: unknown; message?: unknown }) => {
            if (typeof item.msg === 'string') return item.msg
            if (typeof item.message === 'string') return item.message
            return null
          })
          .filter((message): message is string => Boolean(message))
          .join(', ') || fallback
      }
      if (typeof data.message === 'string') {
        return data.message
      }
    } catch {
      return fallback
    }
  }

  try {
    const text = await response.text()
    return text || fallback
  } catch {
    return fallback
  }
}
