"use server"

import { IActionResponse } from "@/models/action-response"
import axiosClient from "@/lib/axios"
import { revalidatePath } from "next/cache"
import { EPages } from "@/lib/pages.enum"
import { IPartnershipView } from "@/models/partnerships"
import { CreatePartnershipInput, createPartnershipSchema } from "./dto/create-partnership.input"
import { UpdatePartnershipInput, updatePartnershipSchema } from "./dto/update-partnership.input"

const PARTNERSHIP_ENDPOINT = "/partnerships"

export async function getPartnershipsAction(): Promise<IActionResponse<IPartnershipView[]>> {
  try {
    const { data } = await axiosClient.get<IPartnershipView[]>(PARTNERSHIP_ENDPOINT)
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

export async function createPartnershipAction(data: CreatePartnershipInput): Promise<IActionResponse<IPartnershipView>> {
  const result = createPartnershipSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: partnership } = await axiosClient.post<IPartnershipView>(PARTNERSHIP_ENDPOINT, data)
    return {
      data: partnership
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

export async function updatePartnershipAction(id: string, data: UpdatePartnershipInput): Promise<IActionResponse<IPartnershipView>> {
  const result = updatePartnershipSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: partnership } = await axiosClient.put<IPartnershipView>(`${PARTNERSHIP_ENDPOINT}/${id}`, data)

    revalidatePath(EPages.ADMIN_SERVICES)

    return {
      data: partnership
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