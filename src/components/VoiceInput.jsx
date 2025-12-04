import { useState, useEffect } from 'react';

export default function VoiceInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setTranscript(speechResult);
      onTranscript(speechResult);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Start recognition immediately
    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [onTranscript]);

  return (
    <div className="p-6 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
      <div className="text-center">
        {isListening && (
          <div className="mb-4">
            <div className="inline-block w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <p className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              Listening...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Speak now
            </p>
          </div>
        )}

        {transcript && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Recognized:</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{transcript}</p>
          </div>
        )}

        {error && (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
