import { signupAction } from "@/app/server-actions/signup";

export default function SignupPage() {
  return (
    <main className="min-h-screen grid place-items-center">
      <form action={signupAction} className="card max-w-sm w-full p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>
        
        <div>
          <label>Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        
        <div>
          <label>Password</label>
          <input name="password" type="password" required className="input" />
        </div>

        <button className="btn w-full" type="submit">
          Registrarse
        </button>
      </form>
    </main>
  );
}
