import { createContext, useContext, useMemo, useReducer } from 'react'

export const QUIZ_STEPS = [
  {
    id: 'skin_type',
    title: 'What is your skin type?',
    subtitle: 'Choose the option that best describes your skin most days.',
  },
  {
    id: 'concerns',
    title: 'What are your skin concerns?',
    subtitle: 'Select all that apply we will prioritise products that address these.',
  },
  {
    id: 'undertone',
    title: 'What is your undertone?',
    subtitle: 'Not sure? Check the hints below each option.',
  },
  {
    id: 'skin_tone',
    title: 'What is your skin tone?',
    subtitle: 'This helps us fine-tune foundation and concealer shades.',
  },
]

export const TOTAL_STEPS = QUIZ_STEPS.length

export const SKIN_TYPE_OPTIONS = [
  {
    value: 'oily',
    label: 'Oily',
    description: 'Shiny T-zone, enlarged pores, prone to breakouts.',
    emoji: '💧',
  },
  {
    value: 'dry',
    label: 'Dry',
    description: 'Tight feeling, flaky patches, rarely gets oily.',
    emoji: '🏜️',
  },
  {
    value: 'combination',
    label: 'Combination',
    description: 'Oily T-zone but dry cheeks. A bit of both.',
    emoji: '⚖️',
  },
  {
    value: 'sensitive',
    label: 'Sensitive',
    description: 'Easily irritated, redness, reacts to new products.',
    emoji: '🌸',
  },
]

export const CONCERN_OPTIONS = [
  { value: 'acne', label: 'Acne & Breakouts', emoji: '🔴' },
  { value: 'dark_spots', label: 'Dark Spots', emoji: '🟤' },
  { value: 'redness', label: 'Redness & Rosacea', emoji: '🩷' },
  { value: 'dullness', label: 'Dull Skin', emoji: '✨' },
  { value: 'aging', label: 'Fine Lines & Aging', emoji: '🕐' },
  { value: 'dryness', label: 'Dryness & Flaking', emoji: '💦' },
]

export const UNDERTONE_OPTIONS = [
  {
    value: 'warm',
    label: 'Warm',
    description: 'Golden or peachy undertones.',
    signs: ['Veins look green', 'Gold jewellery suits you', 'You tan easily'],
    emoji: '☀️',
  },
  {
    value: 'cool',
    label: 'Cool',
    description: 'Pink or blue undertones.',
    signs: ['Veins look blue/purple', 'Silver jewellery suits you', 'You burn easily'],
    emoji: '❄️',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    description: 'A mix of warm and cool — the most versatile.',
    signs: ['Veins look blue-green', 'Both gold and silver work', 'Most shades suit you'],
    emoji: '🌿',
  },
]

export const SKIN_TONE_OPTIONS = [
  { value: 'fair', label: 'Fair', color: '#FDEBD3' },
  { value: 'light', label: 'Light', color: '#F5D5B8' },
  { value: 'medium', label: 'Medium', color: '#D4A574' },
  { value: 'tan', label: 'Tan', color: '#C68642' },
  { value: 'dark', label: 'Dark', color: '#8D5524' },
  { value: 'deep', label: 'Deep', color: '#5C3317' },
]

const initialState = {
  step: 0,
  isComplete: false,

  skin_type: null,
  concerns: [],
  undertone: null,
  skin_tone: null,

  results: null,
  loading: false,
  error: null,
}

function quizReducer(state, action) {
  switch (action.type) {
    case 'NEXT_STEP':
      return {
        ...state,
        step: Math.min(state.step + 1, TOTAL_STEPS - 1),
        error: null,
      }

    case 'PREV_STEP':
      return {
        ...state,
        step: Math.max(state.step - 1, 0),
        error: null,
      }

    case 'GO_TO_STEP':
      return {
        ...state,
        step: Math.max(0, Math.min(action.payload, TOTAL_STEPS - 1)),
        error: null,
      }

    case 'SET_SKIN_TYPE':
      return {
        ...state,
        skin_type: action.payload,
        error: null,
      }

    case 'TOGGLE_CONCERN': {
      const concern = action.payload
      const updated = state.concerns.includes(concern)
        ? state.concerns.filter((c) => c !== concern)
        : [...state.concerns, concern]

      return {
        ...state,
        concerns: updated,
        error: null,
      }
    }

    case 'SET_UNDERTONE':
      return {
        ...state,
        undertone: action.payload,
        error: null,
      }

    case 'SET_SKIN_TONE':
      return {
        ...state,
        skin_tone: action.payload,
        error: null,
      }

    case 'COMPLETE_QUIZ':
      return {
        ...state,
        isComplete: true,
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: true,
        error: null,
      }

    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        loading: false,
        error: null,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

const QuizContext = createContext(null)

export function QuizProvider({ children }) {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  const value = useMemo(() => {
    const canGoNext = (() => {
      switch (state.step) {
        case 0:
          return state.skin_type !== null
        case 1:
          return true
        case 2:
          return state.undertone !== null
        case 3:
          return true
        default:
          return false
      }
    })()

    return {
      state,
      dispatch,
      canGoNext,
      canGoBack: state.step > 0,
      isLastStep: state.step === TOTAL_STEPS - 1,
      progress: Math.round(((state.step + 1) / TOTAL_STEPS) * 100),

      getProfile: () => ({
        skin_type: state.skin_type,
        concerns: state.concerns.length > 0 ? state.concerns : undefined,
        undertone: state.undertone || undefined,
        skin_tone: state.skin_tone || undefined,
        top_n: 10,
      }),
    }
  }, [state])

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const context = useContext(QuizContext)

  if (!context) {
    throw new Error('useQuiz() must be used inside <QuizProvider>')
  }

  return context
}