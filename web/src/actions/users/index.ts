"use server"

import axiosClient from "@/lib/axios"
import { EUserRole, IUserView } from "@/models/user"
import { CreateUserInput, createUserSchema } from "./dtos/create-user.input"
import { getSession } from "@/lib/session"
import { UpdateUserInput, updateUserSchema } from "./dtos/update-user.input"

export async function getProfileAction() {
  try {
    const { data } = await axiosClient.get<IUserView>(`/users/profile`)
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

export async function getUsersAction() {
  try {
    const { data } = await axiosClient.get<IUserView[]>(`/users`)
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

export async function getAttendantsAction() {
  try {
    const { data } = await axiosClient.get<IUserView[]>(`/users/attendants`)
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

export async function createUserAction(data: CreateUserInput) {
  const session = await getSession()

  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER) {
    throw new Error("Você não tem permissão para criar usuários")
  }

  const result = createUserSchema("create").safeParse(data)
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.flatten()))
  }

  try {
    const { data: user } = await axiosClient.post<IUserView>(`/users`, data)
    return user

  } catch (err) {
    const error = err as Error
    if (error.message.includes("ECONNREFUSED")) {
      throw new Error("Erro ao conectar com o servidor")
    }

    if (error.message.includes("User already exists")) {
      throw new Error("Usuário já existe no sistema")
    }

    console.error(error)
    throw error
  }
}

export async function updateUserAction(id: string, data: UpdateUserInput) {
  const session = await getSession()

  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER) {
    throw new Error("Você não tem permissão para editar usuários")
  }

  const result = updateUserSchema.safeParse(data)
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.flatten()))
  }

  try {
    const { data: user } = await axiosClient.put<IUserView>(`/users/${id}`, data)
    return user

  } catch (err) {
    const error = err as Error
    if (error.message.includes("ECONNREFUSED")) {
      throw new Error("Erro ao conectar com o servidor")
    }

    console.error(error)
    throw error
  }
}
