

interface HttpRequest {
  headers?: Record<string, string | string[] | undefined>;
  params?: Record<string, string>;
  body?: unknown;
}

interface HttpResponse {
  status: number;
  body?: unknown;
}

export {
  HttpRequest, HttpResponse,
};
