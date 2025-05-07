export interface IActionResponse<T> {
  data?: T | null
  error?: string | null
}