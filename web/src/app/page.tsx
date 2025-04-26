import { buttonVariants } from "@/components/ui/button"
import { EPages } from "@/lib/pages.enum"
import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col gap-6 items-center justify-center">
      <Image
        src="/logo.png"
        className="h-56"
        alt="Logo Thompson Hill"
        width={300}
        height={300}
      />
      <h1 className="text-3xl font-semibold">Futura página de Login</h1>
      <Link href={EPages.TOTEM_HOME} className={buttonVariants()}>
        <span>Ir para tela do totem</span>
        <ChevronRightIcon />
      </Link>
    </div>
  )
}
