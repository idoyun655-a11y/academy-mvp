import { describe, expect, it } from "vitest";
import { appRouter } from "./server/routers";
import type { TrpcContext } from "./server/_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

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

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 999999,
    openId: "test-admin",
    email: "admin@example.com",
    name: "Test Admin",
    phone: null,
    password: "",
    loginMethod: "email",
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    deletedAt: null,
  };

  return {
    user,
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

describe("commute.recordByPin", () => {
  it("records check-in first, check-out second, and rejects a third entry", async () => {
    const pin = uniquePin();
    const suffix = uniqueSuffix();
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    await publicCaller.auth.signup({
      email: `commute-${suffix}@example.com`,
      password: "ValidPass123",
      passwordConfirm: "ValidPass123",
      name: "출석 테스트 학생",
      phone: "010-1111-2222",
      role: "student",
      attendancePin: pin,
    });

    const first = await adminCaller.commute.recordByPin({ attendancePin: pin });
    expect(first.eventType).toBe("check_in");
    expect(first.attendancePin).toBe(pin);

    const second = await adminCaller.commute.recordByPin({ attendancePin: pin });
    expect(second.eventType).toBe("check_out");
    expect(second.attendancePin).toBe(pin);

    await expect(
      adminCaller.commute.recordByPin({ attendancePin: pin }),
    ).rejects.toThrow();

    const feed = await adminCaller.commute.todayFeed();
    const studentFeed = feed.filter((item: any) => item.attendancePin === pin);
    expect(studentFeed).toHaveLength(2);
    expect(studentFeed.map((item: any) => item.eventType).sort()).toEqual([
      "check_in",
      "check_out",
    ]);
  });

  it("rejects unknown attendance pins", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());

    await expect(
      adminCaller.commute.recordByPin({ attendancePin: "9999" }),
    ).rejects.toThrow();
  });
});
