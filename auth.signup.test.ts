import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type MockRes = {
  clearCookie?: (name: string, options: Record<string, unknown>) => void;
};

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as MockRes,
  };

  return ctx;
}

describe("auth.signup", () => {
  it("올바른 회원가입 데이터로 가입할 수 있어야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signup({
      email: "newuser@example.com",
      password: "ValidPass123",
      passwordConfirm: "ValidPass123",
      name: "테스트사용자",
      phone: "010-1234-5678",
      role: "student",
    });

    expect(result).toHaveProperty("message", "Signup successful");
  });

  it("비밀번호가 8자 미만이면 실패해야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.signup({
        email: "test@example.com",
        password: "Pass1",
        passwordConfirm: "Pass1",
        name: "테스트",
        phone: "010-1234-5678",
        role: "student",
      })
    ).rejects.toThrow();
  });

  it("비밀번호에 대문자가 없으면 실패해야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.signup({
        email: "test@example.com",
        password: "password123",
        passwordConfirm: "password123",
        name: "테스트",
        phone: "010-1234-5678",
        role: "student",
      })
    ).rejects.toThrow();
  });

  it("비밀번호에 숫자가 없으면 실패해야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.signup({
        email: "test@example.com",
        password: "PasswordTest",
        passwordConfirm: "PasswordTest",
        name: "테스트",
        phone: "010-1234-5678",
        role: "student",
      })
    ).rejects.toThrow();
  });

  it("비밀번호와 비밀번호 확인이 다르면 실패해야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.signup({
        email: "test@example.com",
        password: "ValidPass123",
        passwordConfirm: "DifferentPass123",
        name: "테스트",
        phone: "010-1234-5678",
        role: "student",
      })
    ).rejects.toThrow();
  });

  it("잘못된 이메일 형식이면 실패해야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.signup({
        email: "invalid-email",
        password: "ValidPass123",
        passwordConfirm: "ValidPass123",
        name: "테스트",
        phone: "010-1234-5678",
        role: "student",
      })
    ).rejects.toThrow();
  });

  it("이름이 없으면 실패해야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.signup({
        email: "test@example.com",
        password: "ValidPass123",
        passwordConfirm: "ValidPass123",
        name: "",
        phone: "010-1234-5678",
        role: "student",
      })
    ).rejects.toThrow();
  });

  it("학부모 역할로 가입할 수 있어야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signup({
      email: "parent@example.com",
      password: "ParentPass123",
      passwordConfirm: "ParentPass123",
      name: "학부모",
      phone: "010-5678-1234",
      role: "parent",
    });

    expect(result).toHaveProperty("message", "Signup successful");
  });

  it("전화번호는 선택사항이어야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signup({
      email: "nophone@example.com",
      password: "ValidPass123",
      passwordConfirm: "ValidPass123",
      name: "전화없음",
      phone: "",
      role: "student",
    });

    expect(result).toHaveProperty("message", "Signup successful");
  });
});

describe("auth.checkEmail", () => {
  it("올바른 이메일 형식으로 중복 확인할 수 있어야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.checkEmail({
      email: "test@example.com",
    });

    expect(result).toHaveProperty("available");
    expect(typeof result.available).toBe("boolean");
  });

  it("잘못된 이메일 형식이면 실패해야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.checkEmail({
        email: "invalid-email",
      })
    ).rejects.toThrow();
  });

  it("존재하지 않는 이메일은 available이 true여야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.checkEmail({
      email: "nonexistent-unique@example.com",
    });

    expect(result.available).toBe(true);
  });

  it("테스트 계정 이메일은 available이 false여야 함", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.checkEmail({
      email: "admin@test.com",
    });

    expect(result.available).toBe(false);
  });
});
