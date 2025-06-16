import { ApiProperty } from "@nestjs/swagger"
import { Appointment } from "../entities/appointment.entity"

export class AppointmentSummaryView {
  constructor(appointments: Appointment[]) {
    if (!appointments || appointments.length === 0) {
      this.attendantName = 'Atendente não informado'
      this.attendantId = 'Atendente não informado'
      this.totalAppointments = 0
      this.totalServiceWeight = 0
      this.totalPrice = 0
      this.totalDiscount = 0
      this.totalFinalPrice = 0
      this.totalPaymentFee = 0

      this.firstAppointmentDate = null
      this.lastAppointmentDate = null
      this.totalAttendanceMinutes = 0
      this.meanAttendanceTimeByServicesInMinutes = 0
      this.finalServicesPrice = 0
      this.finalProductsPrice = 0
      return
    }

    this.attendantName = appointments[0].attendant?.name || 'Atendente não informado'
    this.attendantId = appointments[0].attendant?.id || 'Atendente não informado'

    this.totalAppointments = appointments.length
    this.totalServiceWeight = appointments.reduce((total, appointment) => total + appointment.totalServiceWeight, 0)

    this.finalServicesPrice = appointments.reduce((total, appointment) => total + appointment.finalServicesPrice, 0)
    this.finalProductsPrice = appointments.reduce((total, appointment) => total + appointment.finalProductsPrice, 0)

    this.totalPrice = this.finalServicesPrice + this.finalProductsPrice
    this.totalDiscount = appointments.reduce((total, appointment) => total + (appointment.discount || 0), 0)
    this.totalFinalPrice = this.totalPrice - this.totalDiscount

    this.totalPaymentFee = appointments.reduce((total, appointment) => total + (appointment.paymentFee || 0), 0)

    this.firstAppointmentDate = appointments.length > 0 ? appointments[0].onServiceAt : null
    this.lastAppointmentDate = appointments.length > 0 ? appointments[appointments.length - 1].finishedAt : null

    this.totalAttendanceMinutes = appointments.reduce((total, appointment) => {
      const start = appointment.onServiceAt ? new Date(appointment.onServiceAt).getTime() : 0
      const end = appointment.finishedAt ? new Date(appointment.finishedAt).getTime() : 0
      return total + (end - start) / (1000 * 60)
    }, 0)

    this.meanAttendanceTimeByServicesInMinutes = this.totalServiceWeight > 0
      ? this.totalAttendanceMinutes / this.totalServiceWeight
      : 0


  }

  @ApiProperty()
  attendantName: string
  @ApiProperty()
  attendantId: string

  @ApiProperty()
  totalAppointments: number
  @ApiProperty()
  totalServiceWeight: number

  @ApiProperty()
  totalPrice: number
  @ApiProperty()
  totalDiscount: number
  @ApiProperty()
  totalFinalPrice: number
  @ApiProperty()
  totalPaymentFee: number

  @ApiProperty()
  firstAppointmentDate: Date | null | undefined = null
  @ApiProperty()
  lastAppointmentDate: Date | null | undefined = null

  @ApiProperty()
  totalAttendanceMinutes: number | null = null
  @ApiProperty()
  meanAttendanceTimeByServicesInMinutes: number | null = null

  @ApiProperty()
  finalServicesPrice: number

  @ApiProperty()
  finalProductsPrice: number
}