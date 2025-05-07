// import { destroySession } from "@/lib/session"
import { redirect } from "next/navigation"

export async function GET(): Promise<Response> {
  // await destroySession()

  redirect("/")
}