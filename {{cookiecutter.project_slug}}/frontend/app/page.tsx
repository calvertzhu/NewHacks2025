import Header from './components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              My Hackathon App
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              A full-stack web application built with FastAPI, Next.js, and MongoDB.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Get Started
              </button>
              <a href="http://localhost:8000/docs" className="text-sm font-semibold leading-6 text-gray-900">
                API Docs <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-indigo-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Fast Development</h3>
                <p className="mt-2 text-gray-600">
                  Pre-configured with authentication, API endpoints, and modern UI components.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-indigo-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Modern Stack</h3>
                <p className="mt-2 text-gray-600">
                  Built with FastAPI, Next.js, MongoDB, and TailwindCSS for rapid development.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-indigo-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Hackathon Ready</h3>
                <p className="mt-2 text-gray-600">
                  Optimized for hackathon development with essential features only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}