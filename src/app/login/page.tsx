import { Leaf } from "lucide-react";
import { DecorBackground } from "@/components/decor-background";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const redirectTo = from && from !== "/login" ? from : "/";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <DecorBackground />
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-[#d89aa6] to-[#b4697a] shadow-[0_8px_18px_rgba(180,105,122,0.28)] dark:from-[#e7a0b0] dark:to-[#c97f92]">
            <Leaf className="size-5 text-[#fff6f4]" strokeWidth={1.7} />
          </div>
          <div>
            <div className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Petty Cash
            </div>
            <div className="mt-0.5 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Karima Urfa Wardiani
            </div>
          </div>
        </div>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
