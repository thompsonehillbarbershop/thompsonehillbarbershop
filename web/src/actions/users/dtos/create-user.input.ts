import { z } from "@/lib/pt-zod"
import { EUserRole } from "@/models/user"

export const createUserSchema = z.object({
  name: z.string().nonempty("Nome é obrigatório"),
  userName: z.string().nonempty("Nome de usuário é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.nativeEnum(EUserRole),
  profileImage: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>