import { getSession } from "@/lib/session"
import AttendantQueuePageContents from "./contents"
import { notFound } from "next/navigation"

export default async function AttendantPage() {
  const session = await getSession()

  if (!session?.user.id) {
    return notFound()
  }

  return <AttendantQueuePageContents
    userId={session?.user.id}
  />
}
