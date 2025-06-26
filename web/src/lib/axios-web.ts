"use client"

import axios, { AxiosError } from "axios"

// Create axios client
const axiosWebClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL as string,
})

axiosWebClient.interceptors.response.use(async (response) => {
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
        case 403:
          console.error("Unauthorized")

          if (error.response?.data?.message.includes("invalid")) {
            throw new Error("Senha ou usuário inválido ou a sessão expirou")
          }

        case 500:
          console.error("Erro no servidor")
        default:
          throw error
      }
    }

    throw error
  })

export default axiosWebClient