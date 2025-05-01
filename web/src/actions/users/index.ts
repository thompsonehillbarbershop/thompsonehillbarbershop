"use server"

import axiosClient from "@/lib/axios"
import { IUserView } from "@/models/user"

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