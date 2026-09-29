import { SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
            S
          </div>
        </div>
        {/* Clerk's pre-built, fully secure SignIn UI component */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#4f46e5",
                colorBackground: "#0f172a",
                colorText: "#f8fafc",
                colorInputBackground: "#1e293b",
                colorInputText: "#f8fafc",
                borderRadius: "0.75rem",
              },
            }}
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
