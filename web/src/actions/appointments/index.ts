"use server"

import { IActionResponse } from "@/models/action-response"
import { CreateAppointmentInput, createAppointmentSchema } from "./dto/create-appointment.input"
import { EAppointmentStatuses, IAppointmentView } from "@/models/appointment"
import axiosClient from "@/lib/axios"
import { UpdateAppointmentInput, updateAppointmentSchema } from "./dto/update-appointment.input"
import { IPaginated } from "@/hooks/use-paginated-query"
import { IAppointmentSummaryView } from "@/models/appointments-summary"

const APPOINTMENTS_END_POINT = "/appointments"

export async function createAppointmentAction(data: CreateAppointmentInput): Promise<IActionResponse<IAppointmentView>> {
  const { success, data: validatedData, error } = createAppointmentSchema.safeParse(data)
  if (!success) {
    return {
      error: JSON.stringify(error.flatten())
    }
  }

  try {
    const { data: appointment } = await axiosClient.post<IAppointmentView>(APPOINTMENTS_END_POINT, validatedData)
    return {
      data: appointment
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

export async function updateAppointmentAction(id: string, data: UpdateAppointmentInput): Promise<IActionResponse<IAppointmentView>> {
  const { success, data: validatedData, error } = updateAppointmentSchema.safeParse(data)
  if (!success) {
    return {
      error: JSON.stringify(error.flatten())
    }
  }

  try {
    const { data: appointment } = await axiosClient.put<IAppointmentView>(`${APPOINTMENTS_END_POINT}/${id}`, validatedData)
    return {
      data: appointment
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

export async function getAppointmentsAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>
): Promise<IActionResponse<IPaginated<IAppointmentView>>> {
  try {
    const { data } = await axiosClient.get<IPaginated<IAppointmentView>>(APPOINTMENTS_END_POINT, {
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

export async function getAppointmentByIdAction(id: string): Promise<IActionResponse<IAppointmentView>> {
  try {
    const { data } = await axiosClient.get<IAppointmentView>(`${APPOINTMENTS_END_POINT}/${id}`)
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

export async function startAttendingAppointmentAction(id: string, attendantId: string): Promise<IActionResponse<IAppointmentView>> {
  try {
    const { data } = await axiosClient.put<IAppointmentView>(`${APPOINTMENTS_END_POINT}/${id}`, {
      attendantId: attendantId,
      status: EAppointmentStatuses.ON_SERVICE
    })
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

export async function getUserAppointmentsSummaryAction(userId: string): Promise<IActionResponse<IAppointmentSummaryView>> {
  try {
    const { data } = await axiosClient.get<IAppointmentSummaryView>(`${APPOINTMENTS_END_POINT}/summary/${userId}`)
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

export async function getAdminAppointmentsSummaryAction({ from, to }: {
  from: Date,
  to?: Date
}): Promise<IActionResponse<IAppointmentSummaryView[]>> {
  try {
    const { data } = await axiosClient.get<IAppointmentSummaryView[]>(`${APPOINTMENTS_END_POINT}/adminSummary`, {
      data: {
        from: from.toISOString(),
        to: to ? to.toISOString() : undefined
      }
    })
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