"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { H1 } from "@/components/ui/typography"
import { useAttendant } from "@/hooks/use-attendant"
import { EPages } from "@/lib/pages.enum"
import { IAppointmentView } from "@/models/appointment"
import { CameraIcon, Loader2Icon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import React, { useEffect, useRef, useState } from 'react'
import Image from "next/image"
import Link from "next/link"

export default function PostCheckoutPage() {
  const { findAttendance, isFindingAttendance, updateCustomerPhoto } = useAttendant()
  const [attendance, setAttendance] = useState<IAppointmentView | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (appointmentId) {
      findAttendance({ id: appointmentId })
        .then(response => {
          if (response.data) {
            setAttendance(response.data)
          } else {
            console.error('Error fetching attendance:', response.error)
          }
        })
        .catch(error => {
          console.error('Error in useEffect:', error)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId])

  async function handlePhotoInput(file: File) {
    setIsLoading(true)
    setSelectedFile(file)
    const profileImage = file.name
    const imageContentType = file.type

    if (!attendance) return

    try {
      const response = await updateCustomerPhoto({
        id: attendance.customer.id,
        profileImage,
        imageContentType,
      })

      if (response.data) {
        // Upload the photo to the google firebase server using the signed URL
        if (response.data.signedUrl) {
          await fetch(response.data.signedUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type || "image/jpeg",
            }
          })
        }
      }

      if (response.error) {
        console.error(response.error)
      }
    } catch (err) {
      const error = err as Error

      console.error(error)
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full">
      {isFindingAttendance && (
        <div className="flex items-center justify-center h-[90svh] w-full">
          <LoadingIndicator size="2xl" />
        </div>
      )}
      {!isFindingAttendance && attendance && (
        <div>
          <H1 className="pb-6">Atualizar foto do Cliente</H1>
          <Card className="pt-0">
            <CardContent className="space-y-6">
              <div className="w-full h-48 pt-4 flex items-center justify-center">
                <input
                  autoFocus={false}
                  id="file"
                  name="file"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  ref={photoRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handlePhotoInput(file)
                    }
                  }}
                />
                {!selectedFile && !attendance.customer?.profileImage && (
                  <Button
                    autoFocus={false}
                    type="button"
                    variant="outline"
                    className="w-full size-48"
                    onClick={() => photoRef.current?.click()}
                  >
                    <CameraIcon className="size-24 stroke-[1.5px]" />
                  </Button>
                )}
                {!selectedFile && !!attendance.customer?.profileImage && (
                  <div className="relative">
                    <Image
                      width={192}
                      height={192}
                      src={attendance.customer?.profileImage}
                      alt="Foto capturada"
                      className="size-48 object-cover rounded-lg aspect-square"
                    />
                    <Button
                      autoFocus={false}
                      type="button"
                      variant="default"
                      className="absolute top-2 right-2 rounded-full size-8"
                      onClick={() => photoRef.current?.click()}
                    >
                      <CameraIcon className="stroke-[1.5px]" />
                    </Button>
                  </div>
                )}
                {selectedFile && (
                  <Image
                    width={192}
                    height={192}
                    src={URL.createObjectURL(selectedFile)}
                    alt="Foto capturada"
                    className="size-48 object-cover rounded-lg aspect-square"
                    onClick={() => photoRef.current?.click()}
                  />
                )}
              </div>
              <Link
                href={EPages.ATTENDANCE_DASHBOARD}
                className={buttonVariants({ size: "lg", className: "w-full text-lg sm:text-2xl" })}
              >
                {isLoading ? <Loader2Icon className="animate-spin size-6" /> : "Voltar para fila"}

              </Link>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
