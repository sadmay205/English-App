import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to control browser-based Text-to-Speech (TTS)
 */
export default function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(0.85); // Default speed is slightly slower for learners
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSupported(true);
    }

    // Cancel speech when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text) => {
    if (!supported) return;

    // Stop current speech
    window.speechSynthesis.cancel();

    if (!text) {
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const togglePlay = (text) => {
    if (isPlaying) {
      stop();
    } else {
      speak(text);
    }
  };

  return {
    isPlaying,
    rate,
    setRate,
    supported,
    speak,
    stop,
    togglePlay,
  };
}
