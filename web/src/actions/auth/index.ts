"use server"

import axiosClient from "@/lib/axios"
import { createSession } from "@/lib/session"
import { IActionResponse } from "@/models/action-response"
import { IAuthView } from "@/models/auth"
import { revalidatePath } from "next/cache"
import { CreateApiKeyInput, createApiKeySchema } from "./dto/create-api-key.input"
import { IApiKeyView } from "@/models/api-key"

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

export async function createApiKeyAction(data: CreateApiKeyInput): Promise<IActionResponse<IApiKeyView>> {
  const result = createApiKeySchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: apiKey } = await axiosClient.post<IApiKeyView>(`auth/api-key`, data)
    return {
      data: apiKey
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

export async function getApiKeysAction(): Promise<IActionResponse<IApiKeyView[]>> {
  try {
    const { data } = await axiosClient.get<IApiKeyView[]>(`auth/api-key`)
    return { data }

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

export async function deleteApiKeyAction(id: string): Promise<IActionResponse<IApiKeyView>> {
  try {
    console.log("Deleting API Key with ID:", id)

    const { data } = await axiosClient.delete<IApiKeyView>(`auth/api-key/${id}`)
    return { data }

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