"use server"

import { getSession } from "@/lib/session"
import { IActionResponse } from "@/models/action-response"
import { CreateCustomerInput, createCustomerSchema } from "./dto/create-customer.input"
import { ICustomerView } from "@/models/customer"
import { EUserRole } from "@/models/user"
import axiosClient from "@/lib/axios"
import { UpdateCustomerInput, updateCustomerSchema } from "./dto/update-customer.input"
import { format } from "date-fns"
import { IPaginated } from "@/hooks/use-paginated-query"

export async function getCustomerByPhoneAction(phoneNumber: string): Promise<IActionResponse<ICustomerView>> {
  const session = await getSession()

  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER && session?.user.role !== EUserRole.TOTEM) {
    return {
      error: "Você não tem permissão para visualizar clientes"
    }
  }

  try {
    const { data } = await axiosClient.get<ICustomerView>(`/customers/phoneNumber/${phoneNumber}`)
    return {
      data
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

export async function createCustomerAction(data: CreateCustomerInput): Promise<IActionResponse<ICustomerView>> {
  const session = await getSession()

  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER && session?.user.role !== EUserRole.TOTEM) {
    return {
      error: "Você não tem permissão para registrar clientes"
    }
  }

  const result = createCustomerSchema.safeParse(data)
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  const [day, month, year] = data.birthDate.split("/")
  const birthDate = new Date(`${year}-${month}-${day}`).toISOString()

  try {
    const { data: customer } = await axiosClient.post<ICustomerView>(`/customers`, { ...data, birthDate })
    return {
      data: customer
    }

  } catch (err) {
    const error = err as Error
    if (error.message.includes("ECONNREFUSED")) {
      return {
        error: "Servidor não está disponível, tente novamente mais tarde."
      }
    }

    if (error.message.includes("Customer already exists")) {
      return {
        error: "Cliente já cadastrado"
      }
    }

    console.error(error)
    return {
      error: error.message
    }
  }
}

export async function updateCustomerAction(id: string, data: UpdateCustomerInput): Promise<IActionResponse<ICustomerView>> {
  const session = await getSession()
  if (session?.user.role !== EUserRole.ADMIN && session?.user.role !== EUserRole.MANAGER && session?.user.role !== EUserRole.TOTEM) {
    return {
      error: "Você não tem permissão para registrar clientes"
    }
  }

  const result = updateCustomerSchema.safeParse({
    ...data,
    birthDate: data.birthDate ? format(data.birthDate, "dd/MM/yyyy") : undefined,
  })
  if (!result.success) {
    return {
      error: JSON.stringify(result.error.flatten())
    }
  }

  try {
    const { data: customer } = await axiosClient.put<ICustomerView>(`/customers/${id}`, data)
    return {
      data: customer
    }

  } catch (err) {
    const error = err as Error
    if (error.message.includes("ECONNREFUSED")) {
      return {
        error: "Servidor não está disponível, tente novamente mais tarde."
      }
    }

    if (error.message.includes("already exists")) {
      return {
        error: "Telefone já cadastrado"
      }
    }

    console.error(error)
    return {
      error: error.message
    }
  }
}

export async function getCustomersAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
): Promise<IActionResponse<IPaginated<ICustomerView>>> {
  try {
    const { data } = await axiosClient.get<IPaginated<ICustomerView>>('/customers', {
      params,
    })

    return { data }
  } catch (err) {
    const error = err as Error

    if (error.message.includes('ECONNREFUSED')) {
      return {
        error: 'Servidor não está disponível, tente novamente mais tarde.',
      }
    }

    console.error(error)
    return {
      error: error.message,
    }
  }
}