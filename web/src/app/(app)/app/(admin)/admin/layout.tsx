import { getSession } from "@/lib/session"
import { EUserRole } from "@/models/user"
import { notFound } from "next/navigation"
import React, { PropsWithChildren } from 'react'

export default async function AdminLayout({ children }: PropsWithChildren) {
  const session = await getSession()

  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER) {
    return notFound()
  }

  return (
    <div>
      <pre>
        {JSON.stringify(session.user, null, 2)}
      </pre>

      {children}
    </div>
  )
}
