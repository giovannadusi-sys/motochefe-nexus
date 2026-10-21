import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar — Motochefe Nexus" };

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Entre com sua conta da unidade Piratininga
          </p>
        </div>

        <LoginForm />
      </Card>
    </div>
  );
}
