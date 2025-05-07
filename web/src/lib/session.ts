"use server"

import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from "jose"
import { addDays } from "date-fns"
import { redirect } from "next/navigation"
import { EPages } from "./pages.enum"
import { EUserRole } from "@/models/user"

export type SessionUser = {
  id?: string
  userName?: string
  role?: EUserRole
}

export type Session = {
  user: SessionUser
  token: string
}

const secretKey = process.env.SESSION_SECRET_KEY as string
const expirationTime = process.env.SESSION_EXPIRATION_TIME as string
const environment = process.env.NODE_ENV as string
const encodedKey = new TextEncoder().encode(secretKey)

export async function createSession(payload: Session) {
  console.log("Creating session", payload)
  console.log("Secret key", secretKey)
  console.log("Expiration time", expirationTime)
  console.log("Environment", environment)

  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(encodedKey)

  console.log("Session", session)

  const expiredAt = addDays(new Date(), 365)
  const cookieStore = await cookies()

  cookieStore.set("session", session, {
    httpOnly: true,
    // secure: environment !== "development" ? true : false,
    secure: false,
    expires: expiredAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession() {
  console.log("Getting session")
  console.log("Secret key", secretKey)
  console.log("Expiration time", expirationTime)
  console.log("Environment", environment)

  const cookieStore = await cookies()
  console.log("Cookie store", cookieStore)

  const cookie = cookieStore.get("session")?.value
  console.log("Cookie", cookie)

  if (!cookie) return null

  try {
    const { payload } = await jwtVerify(cookie, encodedKey, {
      algorithms: ["HS256"],
    })
    console.log("Payload", payload)

    return payload as Session
  } catch (error) {
    console.error("Failed to verify session", error)
    redirect(EPages.LOGOUT)
  }
}

export async function destroySession() {
  (await cookies()).delete('session')
}