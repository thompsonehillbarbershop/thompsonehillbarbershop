import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import axios, { AxiosRequestConfig } from 'axios'

export interface IPaginated<T> {
  data: T[]
  page: number
  limit: number
  total: number
}

interface UsePaginatedFetchOptions<T>
  extends Omit<UseQueryOptions<IPaginated<T>>, 'queryKey' | 'queryFn'> {
  url: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
  enabled?: boolean
  config?: AxiosRequestConfig
}

export function usePaginatedFetch<T>({
  url,
  params = {},
  config,
  enabled = true,
  ...queryOptions
}: UsePaginatedFetchOptions<T>) {
  return useQuery<IPaginated<T>>({
    queryKey: [url, params],
    queryFn: async () => {
      const response = await axios.get<IPaginated<T>>(url, {
        ...config,
        params,
      })
      return response.data
    },
    enabled,
    ...queryOptions,
  })
}
