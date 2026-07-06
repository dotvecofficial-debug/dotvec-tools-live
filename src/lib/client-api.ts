export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    throw new ApiRequestError(
      error instanceof Error ? `Network request failed: ${error.message}` : 'Network request failed.',
      0,
    );
  }

  const raw = await response.text();
  let data: unknown = null;

  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (!response.ok) {
        throw new ApiRequestError(raw.slice(0, 500) || `Request failed with status ${response.status}.`, response.status);
      }
      throw new ApiRequestError('The server returned an invalid response. Please retry after refreshing the page.', response.status);
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : raw.trim() || `Request failed with status ${response.status}.`;
    throw new ApiRequestError(message, response.status);
  }

  if (data === null) {
    throw new ApiRequestError('The server returned an empty response. Please retry after refreshing the page.', response.status);
  }

  return data as T;
}

export function errorMessage(error: unknown, fallback = 'The request could not be completed.'): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
