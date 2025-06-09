"use server"

import { IServiceView } from "@/models/service"
import { CreateServiceInput, createServiceSchema } from "./dto/create-service.input"
import { IActionResponse } from "@/models/action-response"
import axiosClient from "@/lib/axios"
import { UpdateServiceInput, updateServiceSchema } from "./dto/update-service.input"
import { revalidatePath } from "next/cache"
import { EPages } from "@/lib/pages.enum"

export async function getServicesAction(): Promise<IActionResponse<IServiceView[]>> {
  try {
    const { data } = await axiosClient.get<IServiceView[]>(`/services`)
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

export async function createServiceAction(data: CreateServiceInput): Promise<IActionResponse<IServiceView>> {
  const result = createServiceSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: service } = await axiosClient.post<IServiceView>(`/services`, data)
    return {
      data: service
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

export async function updateServiceAction(id: string, data: UpdateServiceInput): Promise<IActionResponse<IServiceView>> {
  const result = updateServiceSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: service } = await axiosClient.put<IServiceView>(`/services/${id}`, data)

    revalidatePath(EPages.ADMIN_SERVICES)

    return {
      data: service
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