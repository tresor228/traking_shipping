// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Arrière-plan animé avec dégradé et formes */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-30 animate-float"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-purple-300 rounded-full opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-pink-300 rounded-full opacity-30 animate-float animation-delay-3000"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          {/* Card principale avec glassmorphism */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="text-center space-y-8">
              {/* Logo avec effet lumineux */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-lg"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/30">
                    <Image
                      src="/next.svg"
                      alt="Next.js Logo"
                      width={180}
                      height={38}
                      priority
                      className="invert w-auto h-6 sm:h-8 md:h-10"
                    />
                  </div>
                </div>
              </div>
              
              {/* Titre avec effet néon */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200 drop-shadow-lg">
                  Bienvenue
                </h1>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent w-3/4 mx-auto"></div>
                <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-md mx-auto font-light">
                  Découvrez une nouvelle expérience
                </p>
              </div>
              
              {/* Boutons avec design futuriste */}
              <div className="space-y-4 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center pt-6">
                <Link
                  href="/auth/connexion"
                  className="group relative block w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-[2px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  <span className="absolute inset-[-1000%] animate-spin bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#3B82F6_50%,#E2E8F0_100%)]"></span>
                  <div className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-4 text-lg font-semibold text-white backdrop-blur-3xl transition-all duration-300 group-hover:from-blue-700 group-hover:to-purple-800 group-hover:scale-105 group-active:scale-95">
                    <span className="relative z-10">Se connecter</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </Link>
                
                <Link
                  href="/auth/inscription"
                  className="group relative block w-full sm:w-auto overflow-hidden rounded-2xl bg-gradient-to-r from-white/10 to-white/5 p-[2px] border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent backdrop-blur-sm"
                >
                  <div className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-white/5 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white transition-all duration-300 group-hover:bg-white/10 group-hover:scale-105 group-active:scale-95">
                    <span className="relative z-10">S'inscrire</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Indicateur de scroll moderne */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Styles CSS personnalisés */}
    </main>
  );
}