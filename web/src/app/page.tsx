import { EPages } from "@/lib/pages.enum"
import { redirect } from "next/navigation"

export default function Home() {
  redirect(EPages.LOGIN)

  // return (
  //   <div className="w-full h-full flex flex-col gap-6 items-center justify-center">
  //     <Image
  //       src="/logo.png"
  //       className="h-56"
  //       alt="Logo Thompson Hill"
  //       width={300}
  //       height={300}
  //     />
  //     <Link href={EPages.LOGIN} className={buttonVariants()}>
  //       <span>Ir para Login</span>
  //       <ChevronRightIcon />
  //     </Link>
  //     <Link href={EPages.TOTEM_HOME} className={buttonVariants()}>
  //       <span>Ir para tela do totem</span>
  //       <ChevronRightIcon />
  //     </Link>
  //   </div>
  // )
}
