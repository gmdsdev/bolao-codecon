const TECHNICAL_ERROR_PATTERNS = [
  /failed query/i,
  /\b(insert|select|update|delete)\b[\s\S]*\b(into|from|set|where)\b/i,
  /\bvalues\s*\(/i,
  /\$\d+/,
  /violates .* constraint/i,
  /relation ".*" does not exist/i,
  /column ".*" .* does not exist/i,
  /syntax error at or near/i,
];

export function getUserErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a ação. Tente novamente.",
) {
  const message = getErrorMessage(error);

  if (!message || isTechnicalErrorMessage(message)) {
    return fallback;
  }

  return message;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return null;
}

function isTechnicalErrorMessage(message: string) {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}
