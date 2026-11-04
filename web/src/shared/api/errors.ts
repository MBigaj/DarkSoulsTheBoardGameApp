/** RFC 9457 problem details: the one error shape every API failure uses. */
export type Problem = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  /** Validation failures, one per bad field. */
  errors?: { pointer?: string; detail: string }[];
};

/** The only error the UI handles: thrown by both mockApi and httpApi. */
export class ApiError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.problem = problem;
  }

  get status(): number {
    return this.problem.status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function notFound(detail: string): ApiError {
  return new ApiError({ type: 'about:blank', title: 'Not Found', status: 404, detail });
}

export function badRequest(detail: string): ApiError {
  return new ApiError({ type: 'about:blank', title: 'Bad Request', status: 400, detail });
}

/**
 * Turns a failed fetch Response into an ApiError, for httpApi. A problem+json body is used
 * as is; anything else (an nginx error page, a timeout) becomes a generic problem.
 */
export async function errorFromResponse(response: Response): Promise<ApiError> {
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('application/problem+json')) {
    try {
      return new ApiError((await response.json()) as Problem);
    } catch {
      // Fall through to the generic problem.
    }
  }
  return new ApiError({
    type: 'about:blank',
    title: response.statusText || 'Request failed',
    status: response.status,
  });
}
