import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { chatWithTutor } from '../services/geminiService';
import { Language } from '../types';

interface ChatTutorProps {
    t: any;
    language: Language;
}

const ChatTutor: React.FC<ChatTutorProps> = ({ t, language }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when component mounts or language changes
  useEffect(() => {
    setMessages([{ role: 'model', text: t.welcome }]);
  }, [t.welcome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Pass the previous history excluding the last user message we just added visually
      const history = messages.slice(); 
      const response = await chatWithTutor(history, userMessage, language);
      
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6 pt-10 md:pt-0 transition-colors duration-200">
      <div className="flex-none px-6 py-4 bg-white dark:bg-gray-800 shadow-sm z-10 border-b border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex items-center space-x-3 max-w-3xl mx-auto">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Bot size={24} />
            </div>
            <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t.title}</h1>
                <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t.online}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        <div className="max-w-3xl mx-auto w-full space-y-4">
            {messages.map((msg, idx) => (
            <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
                <div 
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                }`}
                >
                {msg.role === 'user' ? (
                  msg.text
                ) : (
                  <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                  </div>
                )}
                </div>
            </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center space-x-2">
                        <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs text-gray-400 dark:text-gray-500">{t.thinking}</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors">
        <div className="max-w-3xl mx-auto w-full relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t.placeholder}
                className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-2 mr-2 rounded-xl transition-colors ${input.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400'}`}
            >
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTutor;