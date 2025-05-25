// import { destroySession } from "@/lib/session"
import { EPages } from "@/lib/pages.enum"
import { redirect } from "next/navigation"

export async function GET(): Promise<Response> {
  // await destroySession()

  redirect(EPages.LOGIN)
}