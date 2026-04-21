import { describe, expect, it } from "vitest";
import { appRouter } from "./server/routers";
import type { TrpcContext } from "./server/_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function uniquePin() {
  return String(1000 + Math.floor(Math.random() * 9000));
}

describe("auth.signup", () => {
  it("creates a student when a unique 4-digit attendance pin is provided", async () => {
    const suffix = uniqueSuffix();
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.auth.signup({
      email: `student-${suffix}@example.com`,
      password: "ValidPass123",
      passwordConfirm: "ValidPass123",
      name: "테스트 학생",
      phone: "010-1234-5678",
      role: "student",
      attendancePin: uniquePin(),
    });

    expect(result.user.email).toBe(`student-${suffix}@example.com`);
    expect(result.user.role).toBe("student");
  });

  it("rejects student signup without attendancePin", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.auth.signup({
        email: `missing-pin-${uniqueSuffix()}@example.com`,
        password: "ValidPass123",
        passwordConfirm: "ValidPass123",
        name: "핀 없음",
        phone: "010-1234-5678",
        role: "student",
      }),
    ).rejects.toThrow();
  });

  it("rejects student signup when attendancePin is not 4 digits", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.auth.signup({
        email: `invalid-pin-${uniqueSuffix()}@example.com`,
        password: "ValidPass123",
        passwordConfirm: "ValidPass123",
        name: "잘못된 핀",
        phone: "010-1234-5678",
        role: "student",
        attendancePin: "12a4",
      }),
    ).rejects.toThrow();
  });

  it("rejects duplicate attendancePin for students", async () => {
    const pin = uniquePin();
    const caller = appRouter.createCaller(createPublicContext());

    await caller.auth.signup({
      email: `first-${uniqueSuffix()}@example.com`,
      password: "ValidPass123",
      passwordConfirm: "ValidPass123",
      name: "첫 번째 학생",
      phone: "010-1234-5678",
      role: "student",
      attendancePin: pin,
    });

    await expect(
      caller.auth.signup({
        email: `second-${uniqueSuffix()}@example.com`,
        password: "ValidPass123",
        passwordConfirm: "ValidPass123",
        name: "두 번째 학생",
        phone: "010-1234-5678",
        role: "student",
        attendancePin: pin,
      }),
    ).rejects.toThrow();
  });

  it("allows parent signup without attendancePin", async () => {
    const suffix = uniqueSuffix();
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.auth.signup({
      email: `parent-${suffix}@example.com`,
      password: "ParentPass123",
      passwordConfirm: "ParentPass123",
      name: "테스트 학부모",
      phone: "010-5678-1234",
      role: "parent",
    });

    expect(result.user.email).toBe(`parent-${suffix}@example.com`);
    expect(result.user.role).toBe("parent");
  });
});
