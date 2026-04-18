/**
 * 로컬 개발용 인증 라우터
 * JWT 기반 로그인/회원가입
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { signup, login } from "./auth-local";

export const authLocalRouter = router({
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
      role: z.enum(["admin", "teacher", "student", "parent"]).default("student"),
    }))
    .mutation(async ({ input }) => {
      try {
        const { user, token } = await signup(input.email, input.password, input.name, input.role);
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { user, token } = await login(input.email, input.password);
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
