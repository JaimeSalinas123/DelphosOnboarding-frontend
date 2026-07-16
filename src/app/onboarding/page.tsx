    // src/app/onboarding/page.tsx
    'use client';

    import Link from 'next/link';

    export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6 border-t-4 border-blue-500">
            
            {/* Ícono de éxito */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            </div>

            <div>
            <h2 className="text-2xl font-bold text-slate-900">
                ¡Sesión iniciada correctamente!
            </h2>
            <p className="mt-2 text-slate-600">
                Bienvenido al sistema Delphos Onboarding. Tu cuenta está configurada y lista para usar.
            </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-4">
                (Esta es una página temporal. Aquí irá el dashboard principal).
            </p>
            <Link 
                href="/"
                className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            >
                Volver al inicio
            </Link>
            </div>
        </div>
        </div>
    );
    }