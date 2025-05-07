"use server"

import axiosClient from "@/lib/axios"
import { EUserRole, IUserView } from "@/models/user"
import { CreateUserInput, createUserSchema } from "./dtos/create-user.input"
import { getSession } from "@/lib/session"
import { UpdateUserInput, updateUserSchema } from "./dtos/update-user.input"
import { revalidatePath } from "next/cache"
import { EPages } from "@/lib/pages.enum"
import { IActionResponse } from "@/models/action-response"

export async function getProfileAction(): Promise<IActionResponse<IUserView>> {
  try {
    const { data } = await axiosClient.get<IUserView>(`/users/profile`)
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

export async function getUsersAction(): Promise<IActionResponse<IUserView[]>> {
  try {
    const { data } = await axiosClient.get<IUserView[]>(`/users`)
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

export async function getAttendantsAction(): Promise<IActionResponse<IUserView[]>> {
  try {
    const { data } = await axiosClient.get<IUserView[]>(`/users/attendants`)
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

export async function createUserAction(data: CreateUserInput): Promise<IActionResponse<IUserView>> {
  const session = await getSession()

  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER) {
    return {
      error: "Você não tem permissão para criar usuários"
    }
  }

  const result = createUserSchema("create").safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: user } = await axiosClient.post<IUserView>(`/users`, data)
    return { data: user }

  } catch (err) {
    const error = err as Error
    if (error.message.includes("ECONNREFUSED")) {
      return {
        error: "Servidor não está disponível, tente novamente mais tarde."
      }
    }

    if (error.message.includes("User already exists")) {
      return {
        error: "Usuário já existe no sistema"
      }
    }

    console.error(error)
    return {
      error: error.message
    }
  }
}

export async function updateUserAction(id: string, data: UpdateUserInput): Promise<IActionResponse<IUserView>> {
  const session = await getSession()

  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER) {
    return {
      error: "Você não tem permissão para editar usuários"
    }
  }

  const result = updateUserSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: user } = await axiosClient.put<IUserView>(`/users/${id}`, data)

    revalidatePath(EPages.ADMIN_ATTENDANTS)

    return { data: user }

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
