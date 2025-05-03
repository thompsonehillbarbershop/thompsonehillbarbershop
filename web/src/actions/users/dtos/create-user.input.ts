import { z } from "@/lib/pt-zod"
import { EUserRole, EUserStatus } from "@/models/user"

export const createUserSchema = (type: "create" | "update") => z.object({
  name: type === "create" ? z.string().nonempty("Nome é obrigatório") : z.string().nonempty("Nome é obrigatório").optional(),
  userName: type === "create" ? z.string().nonempty("Nome de usuário é obrigatório") : z.unknown().optional(),
  password: type === "create" ? z.string().min(6, "Senha deve ter no mínimo 6 caracteres") : z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  role: type === "create" ? z.nativeEnum(EUserRole) : z.nativeEnum(EUserRole).optional(),
  status: z.nativeEnum(EUserStatus).optional(),
  profileImage: z.string().optional(),
  profileImageContentType: z.string().optional()
})

export type CreateUserInput = z.infer<ReturnType<typeof createUserSchema>>