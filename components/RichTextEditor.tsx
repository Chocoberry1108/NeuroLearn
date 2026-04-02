import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Undo, Redo, 
  Type, Highlighter, Sigma, X, Maximize, Minus, Plus
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange, placeholder, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fontSize, setFontSize] = useState(15);
  const [isEmpty, setIsEmpty] = useState(!initialContent);

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
        // Simple check to prevent cursor jumping if content is similar
        if (editorRef.current.innerHTML !== initialContent) {
             // If initial content looks like Markdown (starts with # or *), wrap it in paragraphs for the HTML editor
             // This is a basic fallback. Ideally, use a markdown-to-html parser.
             // For now, we assume if it's editing, we just load it.
            editorRef.current.innerHTML = initialContent;
        }
    }
    checkEmpty();
  }, [initialContent]); // Re-run if initialContent changes to keep sync if external update happens

  const checkEmpty = () => {
    if (editorRef.current) {
        const text = editorRef.current.innerText.trim();
        setIsEmpty(text === '' && (!editorRef.current.innerHTML || editorRef.current.innerHTML === '<br>'));
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      checkEmpty();
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
    }
    handleInput(); // Trigger update for buttons like Bold/Italic which change content/style
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          execCommand('insertImage', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const changeFontSize = (delta: number) => {
      const newSize = fontSize + delta;
      setFontSize(newSize);
      // Note: execCommand fontSize uses 1-7 scale, checking specifically for px requires span manipulation
      // For this simplified editor, we'll map to closest execCommand value or use styling wrapper
      // Let's use simple execCommand for robustness in this demo context
      const scale = newSize > 24 ? 7 : newSize > 18 ? 6 : newSize > 16 ? 5 : newSize > 14 ? 4 : newSize > 12 ? 3 : 2; 
      execCommand('fontSize', scale.toString());
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    onClick, 
    isActive = false,
    label 
  }: { icon: any, onClick: () => void, isActive?: boolean, label?: string }) => (
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : ''}`}
      title={label}
      type="button"
    >
      <Icon size={18} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className={`flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 ${className}`}>
      {/* Floating Toolbar Area */}
      <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        
        {/* Top Row: General Utils */}
        <div className="flex items-center space-x-1 p-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
            <ToolbarButton icon={Undo} onClick={() => execCommand('undo')} label="Undo" />
            <ToolbarButton icon={Redo} onClick={() => execCommand('redo')} label="Redo" />
            <ToolbarButton icon={X} onClick={() => execCommand('removeFormat')} label="Clear Format" />
            
            <div className="w-px h-5 bg-gray-300 mx-2"></div>

            <button className="flex items-center space-x-1 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200">
                <Sigma size={16} />
                <span>Công thức</span>
            </button>

            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
                <ImageIcon size={16} />
                <span>Tải ảnh</span>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
            />

            <div className="w-px h-5 bg-gray-300 mx-2"></div>

            <select 
                onChange={(e) => execCommand('formatBlock', e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-100 p-1 rounded"
                defaultValue="p"
            >
                <option value="p">Normal</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="blockquote">Quote</option>
            </select>
        </div>

        {/* Bottom Row: Formatting */}
        <div className="flex items-center space-x-1 p-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-1 mr-2">
                <button onClick={() => changeFontSize(-1)} className="p-1 hover:text-indigo-500"><Minus size={14}/></button>
                <span className="w-8 text-center text-sm font-bold">{fontSize}</span>
                <button onClick={() => changeFontSize(1)} className="p-1 hover:text-indigo-500"><Plus size={14}/></button>
            </div>

            <ToolbarButton icon={Bold} onClick={() => execCommand('bold')} label="Bold" />
            <ToolbarButton icon={Italic} onClick={() => execCommand('italic')} label="Italic" />
            <ToolbarButton icon={Underline} onClick={() => execCommand('underline')} label="Underline" />
            
            <div className="w-px h-5 bg-gray-300 mx-1"></div>
            
            <ToolbarButton icon={AlignLeft} onClick={() => execCommand('justifyLeft')} label="Left" />
            <ToolbarButton icon={AlignCenter} onClick={() => execCommand('justifyCenter')} label="Center" />
            <ToolbarButton icon={AlignRight} onClick={() => execCommand('justifyRight')} label="Right" />

            <div className="w-px h-5 bg-gray-300 mx-1"></div>

            <ToolbarButton icon={List} onClick={() => execCommand('insertUnorderedList')} label="Bullet List" />
            <ToolbarButton icon={ListOrdered} onClick={() => execCommand('insertOrderedList')} label="Number List" />
            
            <div className="flex-1"></div>
            <ToolbarButton icon={Maximize} onClick={() => {}} label="Full Screen" />
        </div>
      </div>

      {/* Editor Content Wrapper */}
      <div className="relative flex-1 flex flex-col min-h-0">
        <div 
            ref={editorRef}
            className="flex-1 p-4 md:p-6 outline-none overflow-y-auto prose prose-indigo dark:prose-invert max-w-none min-h-[400px]"
            contentEditable
            onInput={handleInput}
            style={{ fontSize: `${fontSize}px` }}
        />
        
        {isEmpty && (
            <div className="absolute top-0 left-0 p-4 md:p-6 text-gray-400 pointer-events-none select-none">
                {placeholder || 'Start typing...'}
            </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
