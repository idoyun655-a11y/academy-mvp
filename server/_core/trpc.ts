import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: UNAUTHED_ERR_MSG,
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== "admin" && ctx.user.role !== "superadmin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: NOT_ADMIN_ERR_MSG,
    });
  }

  return next();
});

export const teacherProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== "teacher" && ctx.user.role !== "admin" && ctx.user.role !== "superadmin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Teacher access required",
    });
  }

  return next();
});

export const studentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "student") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Student access required",
    });
  }

  return next();
});
