import { EPages } from "@/lib/pages.enum"
import { getSession } from "@/lib/session"
import { EUserRole } from "@/models/user"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()

  if (session) {
    switch (session.user.role) {
      case EUserRole.TOTEM:
        redirect(EPages.TOTEM_HOME)
        break
      case EUserRole.ADMIN:
        redirect(EPages.ADMIN_DASHBOARD)
        break
      case EUserRole.MANAGER:
        redirect(EPages.ADMIN_DASHBOARD)
        break
      case EUserRole.ATTENDANT:
        redirect(EPages.ATTENDANCE_DASHBOARD)
        break
      case EUserRole.ATTENDANT_MANAGER:
        redirect(EPages.ATTENDANCE_DASHBOARD)
        break
    }
  } else {
    redirect(EPages.LOGIN)
  }

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
