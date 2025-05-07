"use server"

import axiosClient from "@/lib/axios"
import { createSession } from "@/lib/session"
import { IActionResponse } from "@/models/action-response"
import { IAuthView } from "@/models/auth"
import { revalidatePath } from "next/cache"

const apiUrl = process.env.API_URL

export async function loginAction({ password, userName }: { userName: string, password: string }): Promise<IActionResponse<IAuthView>> {
  try {
    const { data } = await axiosClient.post<IAuthView>(`${apiUrl}/auth/login`, { userName, password })
    await createSession({
      user: {
        id: data.id,
        userName: data.userName,
        role: data.userRole
      },
      token: data.token
    })

    revalidatePath("/")

    return {
      data: {
        id: data.id,
        userName: data.userName,
        userRole: data.userRole,
        token: data.token
      }
    }
  } catch (err) {
    const error = err as Error
    if (error.message.includes("ECONNREFUSED")) {
      return {
        error: "Servidor não está disponível, tente novamente mais tarde."
      }
    }

    console.error(error)
    return {
      error: error.message
    }
  }
}