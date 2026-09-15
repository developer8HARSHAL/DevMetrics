function normalizeHeaders(headers) {
  if (!headers || typeof headers !== "object") return {};
  return headers;
}

export function headersToText(headers) {
  return Object.entries(normalizeHeaders(headers))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function textToHeaders(value) {
  const result = {};

  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const headerValue = line
      .slice(separatorIndex + 1)
      .trim();

    if (key) {
      result[key] = headerValue;
    }
  }

  return result;
}

export function requestToForm(request) {
  return {
    id: request.id,
    position: request.position ?? 0,
    method: request.method ?? "GET",
    url: request.url ?? "",
    headers: headersToText(request.headers),
    body:
      request.body == null
        ? ""
        : typeof request.body === "string"
          ? request.body
          : JSON.stringify(request.body, null, 2),
    timeoutMs:
      request.timeout_ms ??
      request.timeoutMs ??
      5000,
    expectedStatus:
      request.expected_status ??
      request.expectedStatus ??
      "",
    saving: false,
    deleting: false,
  };
}

export function parseBody(bodyText) {
  const value = String(bodyText || "").trim();

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(
      "Request body must contain valid JSON."
    );
  }
}