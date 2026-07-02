import React, { useState, useEffect } from 'react';
import { Youtube, Edit2, Check, X, ExternalLink, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { extractYouTubeId } from '../services/geminiService';

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  onUpdateVideoId?: (newVideoId: string) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, title, onUpdateVideoId }) => {
  const [currentVideoId, setCurrentVideoId] = useState(videoId);
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [oembedData, setOembedData] = useState<any>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Link editing states
  const [isEditing, setIsEditing] = useState(false);
  const [newUrl, setNewUrl] = useState(`https://www.youtube.com/watch?v=${videoId}`);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentVideoId(videoId);
    setNewUrl(`https://www.youtube.com/watch?v=${videoId}`);
    setIsValid(null);
  }, [videoId]);

  useEffect(() => {
    let isMounted = true;
    const checkVideoAvailability = async () => {
      if (!currentVideoId) {
        setIsValid(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const videoUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
      try {
        // We use the official YouTube oEmbed API
        const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
        
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setOembedData(data);
          setEmbedHtml(data.html);
          setIsValid(true);
        } else {
          // If official API fails (can happen for private/deleted/age-restricted videos),
          // we attempt a fallback to Noembed (free oEmbed service with excellent CORS support)
          const fallbackRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.error) {
              setIsValid(false);
            } else {
              setOembedData(fallbackData);
              setEmbedHtml(fallbackData.html);
              setIsValid(true);
            }
          } else {
            setIsValid(false);
          }
        }
      } catch (error) {
        console.error("Error fetching oEmbed:", error);
        if (isMounted) {
          // If we fail due to network / CORS, we default to valid to let the iframe load,
          // but we still keep track that we couldn't confirm
          setIsValid(true); 
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkVideoAvailability();
    return () => {
      isMounted = false;
    };
  }, [currentVideoId]);

  const handleUpdateLink = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    
    const extractedId = extractYouTubeId(newUrl);
    if (!extractedId) {
      setEditError("Đường dẫn YouTube không hợp lệ. Vui lòng nhập đúng định dạng (Ví dụ: https://youtube.com/watch?v=... hoặc https://youtu.be/...)");
      return;
    }

    setCurrentVideoId(extractedId);
    setIsEditing(false);
    if (onUpdateVideoId) {
      onUpdateVideoId(extractedId);
    }
  };

  const handleFixVideo = () => {
    setIsEditing(true);
    setNewUrl(`https://www.youtube.com/watch?v=${currentVideoId}`);
  };

  return (
    <div id="youtube-player-container" className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-md transition-all duration-300">
      {/* Header with Title and Edit option */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <Youtube size={18} className="text-red-600 shrink-0 animate-pulse" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate" title={title}>
            {oembedData?.title || title}
          </span>
        </div>
        
        {!isEditing && (
          <button
            id="btn-edit-video-link"
            onClick={handleFixVideo}
            className="flex items-center space-x-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md transition-colors"
          >
            <Edit2 size={12} />
            <span>Sửa video</span>
          </button>
        )}
      </div>

      {/* Editing panel */}
      {isEditing && (
        <form onSubmit={handleUpdateLink} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/10 border-b border-indigo-100/30 dark:border-indigo-950/30 animate-fade-in">
          <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center">
            <HelpCircle size={14} className="mr-1.5" />
            Thay thế bằng link YouTube mới để sửa lỗi video
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="input-new-youtube-url"
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Dán link YouTube tại đây (ví dụ: https://www.youtube.com/watch?v=...)"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center space-x-1 justify-end">
              <button
                id="btn-save-video-link"
                type="submit"
                className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Check size={14} />
                <span>Lưu</span>
              </button>
              <button
                id="btn-cancel-edit-video"
                type="button"
                onClick={() => { setIsEditing(false); setEditError(null); }}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
              >
                <X size={14} />
                <span>Hủy</span>
              </button>
            </div>
          </div>
          {editError && (
            <p className="text-[10px] text-red-500 font-medium mt-1.5 flex items-center">
              <AlertCircle size={11} className="mr-1" />
              {editError}
            </p>
          )}
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">
            * Mẹo: Bạn có thể sao chép link video từ trình duyệt hoặc app YouTube rồi dán trực tiếp vào đây.
          </div>
        </form>
      )}

      {/* Main player display */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Đang tải cấu hình oEmbed...</p>
          </div>
        ) : isValid === false ? (
          /* Error State: Video is unavailable or failed to embed */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-950 text-white animate-fade-in">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h4 className="text-sm font-bold text-gray-100 mb-1">Video không khả dụng hoặc bị chặn nhúng</h4>
            <p className="text-xs text-gray-400 max-w-md mb-4">
              Người đăng video có thể đã tắt tính năng nhúng ngoài YouTube hoặc video đã chuyển sang chế độ riêng tư/bị xóa.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all"
              >
                <span>Xem trực tiếp trên YouTube</span>
                <ExternalLink size={12} />
              </a>
              <button
                id="btn-fix-error-video"
                onClick={handleFixVideo}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-700 transition-all"
              >
                <Edit2 size={12} />
                <span>Đổi link video khác</span>
              </button>
            </div>
          </div>
        ) : embedHtml ? (
          /* Render utilizing oEmbed HTML */
          <div 
            className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:aspect-video"
            dangerouslySetInnerHTML={{ __html: embedHtml }}
          />
        ) : (
          /* Fallback direct iframe if oembed succeeded but didn't return HTML */
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&modestbranding=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        )}
      </div>

      {/* Author and Channel attribution from oEmbed */}
      {oembedData && isValid && (
        <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/40 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/60">
          <span className="truncate">
            Kênh: <strong className="text-gray-700 dark:text-gray-300">{oembedData.author_name}</strong>
          </span>
          <a
            href={oembedData.author_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline dark:text-indigo-400 flex items-center shrink-0"
          >
            Ghé thăm kênh <ExternalLink size={10} className="ml-0.5" />
          </a>
        </div>
      )}
    </div>
  );
};
