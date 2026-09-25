/** Mirrors `models::document::FileVersion` in Rust. */
export interface FileVersion {
  hash: string;
  modifiedMs: number;
}

/** Mirrors `models::document::RenamedDocument` in Rust. */
export interface RenamedDocument {
  path: string;
  name: string;
}

/** Mirrors `models::document::DocumentFile` in Rust. */
export interface DocumentFile {
  path: string;
  name: string;
  content: string;
  version: FileVersion;
}

export type AppErrorKind =
  | "notFound"
  | "permissionDenied"
  | "conflict"
  | "notAllowed"
  | "notMarkdown"
  | "libraryNotConfigured"
  | "invalidName"
  | "alreadyExists"
  | "io";

/** Mirrors `models::error::AppError` as serialized by Rust. */
export interface AppError {
  kind: AppErrorKind;
  message: string;
  current?: FileVersion;
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AppError).kind === "string" &&
    typeof (value as AppError).message === "string"
  );
}

/** Normalizes anything thrown by a Tauri command into an AppError. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  return { kind: "io", message };
}
