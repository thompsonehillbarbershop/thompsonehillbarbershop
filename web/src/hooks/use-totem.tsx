import { getAttendantsAction } from "@/actions/users"
import { queries } from "@/lib/query-client"
import { useQuery } from "@tanstack/react-query"

export const useTotem = () => {
  const { data: attendants, isLoading: isLoadingAttendants } = useQuery({
    queryKey: [queries.totem.attendants],
    queryFn: async () => {

      const users = await getAttendantsAction()

      return users.map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }))
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  })

  return {
    attendants,
    isLoadingAttendants
  }
}