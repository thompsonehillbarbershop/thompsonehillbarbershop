"use client"

import { EPages } from "@/lib/pages.enum"
import { CheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function TotemConfirmationPage() {
  const [count, setCount] = useState(6)
  const router = useRouter()

  setTimeout(() => {
    setCount(count - 1)
  }, 1000)

  useEffect(() => {
    if (count <= 0) {
      router.push(EPages.TOTEM_HOME)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <div className="w-full h-full flex flex-col items-center justify-start gap-6 sm:gap-20 py-10">
      <div className="flex flex-row items-center gap-4">
        <CheckIcon size={64} className=" text-primary" />
        <p className="text-4xl sm:text-5xl font-bold text-primary font-spectral tracking-wide text-center">Confirmado com sucesso!</p>
      </div>
      <p className="text-2xl sm:text-4xl font-semibold font-spectral tracking-wide text-center">Aguarde ser chamado para o atendimento</p>
      <p className="text-2xl sm:text-5xl text-foreground/80 text-center font-spectral tracking-wide font-semibold leading-relaxed">Obrigado por escolher a <br /><strong className="text-primary font-bold">THOMPSON & HILL</strong></p>

      <p className="text-xl text-muted-foreground fixed bottom-0 pb-6">Retornando a página inicial em {count} segundos</p>
    </div>
  )
}
