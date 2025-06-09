"use server"

import { IProductView } from "@/models/product"
import { IActionResponse } from "@/models/action-response"
import axiosClient from "@/lib/axios"
import { revalidatePath } from "next/cache"
import { EPages } from "@/lib/pages.enum"
import { CreateProductInput, createProductSchema } from "./dto/create-product.input"
import { UpdateProductInput, updateProductSchema } from "./dto/update-product.input"

export async function getProductsAction(): Promise<IActionResponse<IProductView[]>> {
  try {
    const { data } = await axiosClient.get<IProductView[]>(`/products`)
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

export async function createProductAction(data: CreateProductInput): Promise<IActionResponse<IProductView>> {
  const result = createProductSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: product } = await axiosClient.post<IProductView>(`/products`, data)
    return {
      data: product
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

export async function updateProductAction(id: string, data: UpdateProductInput): Promise<IActionResponse<IProductView>> {
  const result = updateProductSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: product } = await axiosClient.put<IProductView>(`/products/${id}`, data)

    revalidatePath(EPages.ADMIN_SERVICES)

    return {
      data: product
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