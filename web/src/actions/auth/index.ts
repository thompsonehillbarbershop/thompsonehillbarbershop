"use server"

import axiosClient from "@/lib/axios"
import { createSession } from "@/lib/session"
import { IAuthView } from "@/models/auth"
import { revalidatePath } from "next/cache"

export async function loginAction({ password, userName }: { userName: string, password: string }) {
  try {
    const { data } = await axiosClient.post<IAuthView>(`/auth/login`, { userName, password })
    await createSession({
      user: {
        id: data.id,
        userName: data.userName,
        role: data.userRole
      },
      token: data.token
    })

    revalidatePath("/")
    return data
  } catch (err) {
    const error = err as Error
    if (error.message.includes("ECONNREFUSED")) {
      throw new Error("Erro ao conectar com o servidor")
    }

    console.error(error)
    throw error
  }
}