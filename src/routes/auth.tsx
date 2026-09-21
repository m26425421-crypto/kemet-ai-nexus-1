import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LogoWordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "تسجيل الدخول — KEMET AI" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, locale } = useI18n();
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoWordmark />
          <h1 className="mt-4 text-2xl font-bold">
            {locale === "ar" ? "مرحباً بك" : "Welcome"}
          </h1>
          <p className="text-sm text-muted-foreground">{t("app_tagline")}</p>
        </div>

        <GoogleButton />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t("or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{t("cta_signin")}</TabsTrigger>
            <TabsTrigger value="signup">{t("cta_signup")}</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="pt-4">
            <SignInForm />
          </TabsContent>
          <TabsContent value="signup" className="pt-4">
            <SignUpForm />
          </TabsContent>
        </Tabs>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t("auth_terms")}
        </p>
        <div className="mt-2 text-center">
          <Link to="/" className="text-xs text-muted-foreground underline underline-offset-4">
            {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  async function handle() {
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) {
        toast.error(res.error.message ?? "Google sign-in failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button
      onClick={handle}
      disabled={busy}
      variant="outline"
      className="h-11 w-full gap-2 font-medium"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
      {t("signin_google")}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(t("invalid_credentials"));
    navigate({ to: "/home", replace: true });
  }

  async function reset() {
    if (!email) return toast.info(t("email"));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success(t("reset_sent"));
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="si-email">{t("email")}</Label>
        <Input
          id="si-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          dir="ltr"
        />
      </div>
      <div>
        <Label htmlFor="si-pw">{t("password")}</Label>
        <Input
          id="si-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          dir="ltr"
        />
      </div>
      <Button type="submit" disabled={busy} className="h-11 w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
        {t("cta_signin")}
      </Button>
      <button
        type="button"
        onClick={reset}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        {t("forgot_password")}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error(t("weak_password"));
    setBusy(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setBusy(false);
    if (error) {
      if (/registered|exists/i.test(error.message)) toast.error(t("email_taken"));
      else toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/home", replace: true });
    } else {
      toast.success(t("check_email"));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label htmlFor="su-name">{t("full_name")}</Label>
        <Input
          id="su-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />
      </div>
      <div>
        <Label htmlFor="su-email">{t("email")}</Label>
        <Input
          id="su-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          dir="ltr"
        />
      </div>
      <div>
        <Label htmlFor="su-pw">{t("password")}</Label>
        <Input
          id="su-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          dir="ltr"
        />
      </div>
      <Button type="submit" disabled={busy} className="h-11 w-full">
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {t("cta_signup")}
      </Button>
    </form>
  );
}