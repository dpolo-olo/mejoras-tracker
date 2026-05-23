const API_URL = 'https://api.anthropic.com/v1/messages'

const HEADERS = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
})

export async function analyzeImage(
  apiKey: string,
  imageBase64: string,
  mediaType: string,
): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: HEADERS(apiKey),
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Analiza esta imagen como si fuera una foto de un reporte, tabla, formulario o documento.
Detecta el error estructural o de integridad de datos más importante, priorizando en este orden:
1. Nombres repetidos en columna central
2. Campos vacíos
3. Filas o columnas incompletas
4. Datos duplicados
5. Espacios en blanco anómalos

Reglas estrictas:
- No hagas cálculos ni interpretaciones numéricas
- Solo describe errores estructurales o de integridad
- Responde ÚNICAMENTE con un título de máximo 10 palabras que describa el error principal
- Sin puntuación al final, sin comillas, sin explicaciones adicionales`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `Error ${response.status} al llamar a Claude`)
  }

  const data = await response.json() as { content: Array<{ text: string }> }
  return data.content[0]?.text?.trim() ?? 'Error no identificado'
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: HEADERS(apiKey),
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    })
    return response.ok
  } catch {
    return false
  }
}
