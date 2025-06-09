import { getSession } from "@/lib/session"
import { notFound } from "next/navigation"
import AttendantSummaryPage from "./contents"

export default async function AttendantPage() {
  const session = await getSession()

  if (!session?.user.id) {
    return notFound()
  }

  return <AttendantSummaryPage
    userId={session?.user.id}
  />
}
