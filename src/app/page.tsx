import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="max-w-2xl space-y-8 opacity-0 animate-[fadeIn_1s_ease-out_forwards] translate-y-4">
        <div className="space-y-3">
          <h1 className="text-6xl md:text-8xl font-medium tracking-tight text-white">
            Kenshō
          </h1>
          <p className="text-xl md:text-2xl font-light text-slate-400 tracking-wide italic">
            See through the noise.
          </p>
        </div>
        
        <p className="text-lg md:text-xl text-slate-300 max-w-lg mx-auto font-light leading-relaxed">
          Turn any PDF into a smart study deck. 
          <br className="hidden md:block"/>
          Review what matters, when it matters.
        </p>

        <div className="pt-8">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-base font-medium text-black transition-all hover:bg-gold-hover hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Start learning
          </Link>
        </div>
      </div>
    </main>
  );
}
