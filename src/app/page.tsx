// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
      <div className="flex flex-col items-center gap-8 max-w-2xl text-center">
        <Image
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={38}
          priority
          className="dark:invert"
        />
        
        <h1 className="text-4xl font-bold">Bienvenue</h1>
        
        <div className="flex gap-4">
          <Link
            href="/auth/connexion"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/auth/inscription"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Inscription
          </Link>
        </div>
      </div>
    </main>
  );
}