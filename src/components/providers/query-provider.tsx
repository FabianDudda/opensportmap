'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  useEffect(() => {
    const persister = createSyncStoragePersister({ storage: window.localStorage })
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 30 * 60 * 1000, // 30 minutes
      // Only persist the lightweight places query
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => query.queryKey[0] === 'places-lightweight',
      },
    })
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}