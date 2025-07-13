// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 gap-8 bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-8 max-w-2xl w-full text-center">
        <Image
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={38}
          priority
          className="dark:invert"
        />
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Bienvenue</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/auth/connexion"
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors text-base font-medium text-center"
          >
            Connexion
          </Link>
          <Link
            href="/auth/inscription"
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors text-base font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-center"
          >
            Inscription
          </Link>
        </div>
      </div>
    </main>
  );
}