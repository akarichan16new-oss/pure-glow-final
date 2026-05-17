/**
 * PureGlow AI - App Shell
 * ========================
 *
 * Routes:
 *   /           -> HomePage
 *   /quiz       -> QuizPage
 *   /results    -> ResultsPage
 *   /routine    -> RoutinePage
 *   *           -> NotFoundPage
 */

import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useQuiz } from './context/QuizContext'

import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import ResultsPage from './pages/ResultsPage'

// ============================================================================
// Routine Page
// ============================================================================

function RoutinePage() {
  const { state } = useQuiz()

  if (!state.skin_type) {
    return <Navigate to="/quiz" replace />
  }

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fade-in">
      <div className="card">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-500 mb-2">
          PureGlow Routine
        </p>

        <h2 className="text-2xl md:text-3xl font-display font-bold text-warm-50 mb-3">
          Your skincare routine ✨
        </h2>

        <p className="text-warm-100 mb-6">
          Here is a simple routine based on your quiz profile.
        </p>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-rose-100 bg-white p-5">
            <h3 className="font-bold text-warm-50 mb-1">Morning</h3>
            <p className="text-sm text-warm-100">
              Gentle cleanser → lightweight moisturiser → SPF 50 sunscreen.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5">
            <h3 className="font-bold text-warm-50 mb-1">Evening</h3>
            <p className="text-sm text-warm-100">
              Cleanser → treatment product for your concerns → moisturiser.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-warm-100">
          <p>
            <span className="font-semibold">Skin type:</span>{' '}
            {state.skin_type || 'Not selected'}
          </p>

          <p>
            <span className="font-semibold">Concerns:</span>{' '}
            {state.concerns.length > 0 ? state.concerns.join(', ') : 'None selected'}
          </p>

          <p>
            <span className="font-semibold">Undertone:</span>{' '}
            {state.undertone || 'Not selected'}
          </p>

          <p>
            <span className="font-semibold">Skin tone:</span>{' '}
            {state.skin_tone || 'Not selected'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 404 Page
// ============================================================================

function NotFoundPage() {
  return (
    <div className="text-center py-20 animate-fade-in">
      <h1 className="text-6xl font-display font-bold text-rose-300 mb-4">
        404
      </h1>

      <p className="text-xl text-warm-100 mb-8">
        Page not found
      </p>

      <Link to="/" className="btn-primary inline-block no-underline">
        Go Home
      </Link>
    </div>
  )
}

// ============================================================================
// App Root
// ============================================================================

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/routine" element={<RoutinePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}