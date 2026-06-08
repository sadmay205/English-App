import { create } from 'zustand';
import api from '../services/api';

const useQuizStore = create((set, get) => ({
  // State
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  quizType: 'multiple-choice-vie',
  setTitle: '',
  setId: null,
  isLoading: false,
  isCompleted: false,
  showResult: false,
  error: null,

  timeLimit: null,

  // Generate a quiz
  generateQuiz: async (setId, type = 'multiple-choice-vie', count = 10, timeLimit = null) => {
    set({ isLoading: true, error: null, isCompleted: false, showResult: false, timeLimit });
    try {
      const { data } = await api.get(`/quiz/generate/${setId}?type=${type}&count=${count}`);
      set({
        questions: data.questions,
        currentIndex: 0,
        answers: new Array(data.questions.length).fill(null),
        score: 0,
        quizType: type,
        setTitle: data.setTitle,
        setId,
        isLoading: false,
        isCompleted: false,
      });
      return data;
    } catch (error) {

      set({ error: error.response?.data?.message || 'Lỗi khi tạo quiz', isLoading: false });
      return null;
    }
  },

  // Generate a custom quiz
  generateCustomQuiz: async (setId, config, wordIds, timeLimit = null) => {
    set({ isLoading: true, error: null, isCompleted: false, showResult: false, timeLimit });
    try {
      const { data } = await api.post('/quiz/generate-custom', {
        setId,
        wordIds,
        typesConfig: config,
        timeLimit,
      });
      set({
        questions: data.questions,
        currentIndex: 0,
        answers: new Array(data.questions.length).fill(null),
        score: 0,
        quizType: 'custom',
        setTitle: data.setTitle,
        setId,
        isLoading: false,
        isCompleted: false,
      });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Lỗi khi tạo bài kiểm tra tùy chỉnh', isLoading: false });
      return null;
    }
  },

  // Submit an answer for current question
  submitAnswer: (answerValue) => {
    const { questions, currentIndex, answers, score } = get();
    const question = questions[currentIndex];
    if (!question) return;

    let isCorrect = false;

    if (question.type === 'multiple-choice-vie' || question.type === 'multiple-choice-en') {
      isCorrect = answerValue === question.correctIndex;
    } else if (question.type === 'fill-blank' || question.type === 'fill-blank-en') {
      isCorrect = answerValue.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    }

    const newAnswers = [...answers];
    newAnswers[currentIndex] = {
      value: answerValue,
      isCorrect,
      correctAnswer: question.correctAnswer,
    };

    set({
      answers: newAnswers,
      score: isCorrect ? score + 1 : score,
    });

    return isCorrect;
  },

  // Move to next question
  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ isCompleted: true });
    }
  },

  // Submit quiz results to server
  submitQuiz: async () => {
    const { setId, quizType, score, questions } = get();
    try {
      const { data } = await api.post('/quiz/submit', {
        vocabSetId: setId,
        quizType,
        score,
        totalQuestions: questions.length,
      });
      set({ showResult: true });
      return data;
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  },

  // Reset quiz
  resetQuiz: () => {
    set({
      questions: [],
      currentIndex: 0,
      answers: [],
      score: 0,
      isCompleted: false,
      showResult: false,
      setId: null,
      setTitle: '',
      error: null,
    });
  },
}));

export default useQuizStore;
