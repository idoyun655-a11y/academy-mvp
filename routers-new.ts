    signup: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
          name: z.string().min(1),
          phone: z.string().optional(),
          role: z.enum(["student", "parent"]).default("student"),
        })
      )
      .mutation(async ({ input }) => {
        const passwordValidation = validatePassword(input.password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.message);
        }

        const TEST_USERS = require('./auth').TEST_USERS;
        if (input.email in TEST_USERS) {
          throw new Error("Already registered email");
        }

        const newUser: AuthUser = {
          id: Math.floor(Math.random() * 10000),
          email: input.email,
          name: input.name,
          role: input.role as 'student' | 'parent',
        };

        return {
          user: newUser,
          token: generateToken(newUser),
          message: "Signup successful",
        };
      }),

    checkEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(({ input }) => {
        const TEST_USERS = require('./auth').TEST_USERS;
        const exists = input.email in TEST_USERS;
        return { available: !exists };
      }),
