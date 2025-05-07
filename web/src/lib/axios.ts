"use server"

import axios, { AxiosError } from "axios"
import { redirect } from "next/navigation"
import { getSession } from "./session"

// Create axios client
const axiosClient = axios.create({
  baseURL: process.env.API_URL as string,
})

axiosClient.interceptors.request.use(async (request) => {
  try {
    const session = await getSession()
    if (!session) return request
    const token = session?.token
    request.headers.Authorization = `Bearer ${token}`
    return request
  } catch (error) {
    throw error
  }
})

axiosClient.interceptors.response.use(async (response) => {
  return response
},
  async (error) => {
    console.error("Error in axios interceptor", error)
    if (error instanceof AxiosError) {
      console.error(error.response?.data)

      switch (error.response?.status) {
        case 400:
          if (error.response?.data?.message.includes("Invalid credentials")) {
            throw new Error("Senha ou usuário inválido")
          }

          throw new Error("Bad request " + error.response?.data?.message)

        case 401:
          console.error("Unauthorized")

          if (error.response?.data?.message.includes("invalid")) {
            throw new Error("Senha ou usuário inválido")
          }

          redirect("/api/auth/logout")
        case 500:
          console.error("Erro no servidor")
        default:
          throw error
      }
    }

    throw error
  })

export default axiosClient