
import { GoogleGenAI, Type } from "@google/genai";
import { Course, Module, Lesson, Language, VerificationResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const COURSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    category: { type: Type.STRING },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lessons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.STRING },
                content: { type: Type.STRING, description: "Detailed educational content for the lesson in Markdown format." },
                youtubeVideos: {
                  type: Type.ARRAY,
                  description: "A list of 1-2 highly relevant YouTube videos found via search.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      videoId: { type: Type.STRING, description: "The YouTube Video ID (e.g., dQw4w9WgXcQ)" }
                    }
                  }
                },
                images: {
                  type: Type.ARRAY,
                  description: "A list of 3-4 relevant educational image URLs found via search.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING, description: "Direct publicly accessible URL to a high-quality relevant image." }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

const LESSON_CONTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    markdownContent: { type: Type.STRING, description: "The educational content in Markdown format, with embedded images." },
    youtubeVideos: {
      type: Type.ARRAY,
      description: "A list of 1-2 highly relevant YouTube videos found via search.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          videoId: { type: Type.STRING, description: "The YouTube Video ID (e.g., dQw4w9WgXcQ)" }
        }
      }
    },
    images: {
      type: Type.ARRAY,
      description: "A list of 3-4 relevant educational image URLs found via search.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING, description: "Direct publicly accessible URL to a high-quality relevant image." }
        }
      }
    }
  }
};

const FILE_LESSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    markdownContent: { type: Type.STRING, description: "The educational content generated from the file." },
    youtubeVideos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          videoId: { type: Type.STRING }
        }
      }
    },
    images: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING }
        }
      }
    }
  }
};

const VERIFICATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { 
      type: Type.STRING, 
      enum: ['ACCURATE', 'PARTIALLY_ACCURATE', 'INACCURATE'],
      description: "Overall accuracy assessment of the content." 
    },
    analysis: { 
      type: Type.STRING, 
      description: "A detailed analysis of the facts checked using Google Search." 
    },
    suggestedCorrections: { 
      type: Type.STRING, 
      description: "If there are inaccuracies, suggest corrections. Otherwise empty." 
    }
  }
};

export const generateCourseStructure = async (
  topic: string, 
  language: Language, 
  fileData?: { mimeType: string, data: string }
): Promise<Partial<Course>> => {
  const langPrompt = language === 'vi' ? 'Vietnamese' : 'English';
  
  try {
    const parts: any[] = [];
    
    if (fileData) {
        parts.push({
            inlineData: {
                mimeType: fileData.mimeType,
                data: fileData.data
            }
        });
        parts.push({
            text: `Analyze the attached file content and create a comprehensive course structure based on it.
            The content MUST be in ${langPrompt} language.
            Include 3 modules, each with 2 lessons.
            For each lesson, generate detailed educational content in Markdown format (at least 200 words). 
            Use clear headings (## and ###), bullet points, and bold text for key concepts to make it highly readable.
            USE GOOGLE SEARCH to find 1-2 relevant YouTube videos and 2-3 relevant educational images for EACH lesson.
            EMBED the images DIRECTLY into the Markdown content using syntax \`![Alt Text](URL)\`.`
        });
    } else {
        parts.push({
            text: `Create a comprehensive course structure for the topic: "${topic}". 
            The content MUST be in ${langPrompt} language.
            Include 3 modules, each with 2 lessons.
            For each lesson, generate detailed educational content in Markdown format (at least 200 words).
            Use clear headings (## and ###), bullet points, and bold text for key concepts to make it highly readable.
            USE GOOGLE SEARCH to find 1-2 relevant YouTube videos and 2-3 relevant educational images for EACH lesson.
            EMBED the images DIRECTLY into the Markdown content using syntax \`![Alt Text](URL)\`.`
        });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: parts.length === 1 ? parts[0].text : { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: COURSE_SCHEMA,
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    const modules: Module[] = data.modules?.map((mod: any, mIdx: number) => ({
      id: `m-${Date.now()}-${mIdx}`,
      title: mod.title,
      lessons: mod.lessons?.map((les: any, lIdx: number) => {
        let content = (les.content || "").replace(/\\n/g, '\n');
        const images = les.images || [];
        const videos = les.youtubeVideos || [];
        
        if (images.length > 0) {
          const contentParts = content.split('\n\n');
          let imgIndex = 0;
          let newContentParts = [];
          let imagesEmbeddedCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;

          const shouldInjectMore = imagesEmbeddedCount < images.length;

          if (shouldInjectMore) {
            for (let i = 0; i < contentParts.length; i++) {
                newContentParts.push(contentParts[i]);
                const isHeading = contentParts[i].trim().startsWith('#');
                if (imgIndex < images.length && i < contentParts.length - 1) {
                    const partHasImage = /!\[.*?\]\(.*?\)/.test(contentParts[i]);
                    if (!partHasImage && (isHeading || (i > 2 && i % 4 === 0))) {
                        newContentParts.push(`![${images[imgIndex].title}](${images[imgIndex].url})`);
                        imgIndex++;
                    }
                }
            }
            content = newContentParts.join('\n\n');
          }
        }

        return {
          id: `l-${Date.now()}-${mIdx}-${lIdx}`,
          title: les.title,
          description: les.description,
          duration: les.duration || "5 min",
          content: content,
          images: images,
          videos: videos,
          isCompleted: false,
        };
      }) || []
    })) || [];

    return {
      title: data.title || topic,
      description: data.description,
      category: data.category || "General",
      modules,
      thumbnail: `https://picsum.photos/seed/${(data.title || topic).replace(/\s/g, '')}/400/300`,
      author: "Gemini AI",
      rating: 5.0,
      students: 1,
      progress: 0,
      isGenerated: true,
      status: 'draft',
      visibility: 'private',
      isCreatedByUser: true
    };
  } catch (error) {
    console.error("Error generating course:", error);
    throw error;
  }
};

export const generateLessonContent = async (courseTitle: string, lessonTitle: string, language: Language): Promise<{ content: string; sources: { title: string; uri: string }[]; videos: { title: string; videoId: string }[]; images: { title: string; url: string }[] }> => {
  const langPrompt = language === 'vi' ? 'Vietnamese' : 'English';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert tutor writing content for a student in ${langPrompt}.
      
      Topic: Lesson "${lessonTitle}" of course "${courseTitle}".

      INSTRUCTIONS:
      1. Write a comprehensive lesson with a clear logical flow using Markdown.
      2. USE GOOGLE SEARCH to find 3-4 distinct, high-quality, relevant educational images (diagrams, charts, or real-world examples).
      3. **CRITICAL**: Select images that have publicly accessible URLs (e.g., from Wikimedia, public educational sites).
      4. EMBED these images DIRECTLY into the Markdown content using syntax \`![Alt Text](URL)\`. Place them after relevant section headings to make the content visual.
      5. USE GOOGLE SEARCH to find 1-2 relevant YouTube videos.
      
      Make the content visually engaging by interleaving text and images.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: LESSON_CONTENT_SCHEMA,
      }
    });

    const json = JSON.parse(response.text || "{}");
    let content = (json.markdownContent || "").replace(/\\n/g, '\n');
    const images = json.images || [];
    
    // --- POST-PROCESSING: AUTO-INJECT IMAGES IF MISSING ---
    const hasEmbeddedImages = /!\[.*?\]\(.*?\)/.test(content);
    
    // If the model found images but didn't embed them enough, or even if it did, 
    // we want to make sure the markdown has them if possible.
    if (images.length > 0) {
      const parts = content.split('\n\n');
      let imgIndex = 0;
      let newContentParts = [];
      let imagesEmbeddedCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;

      // Only inject if we feel like there aren't enough images in the text
      const shouldInjectMore = imagesEmbeddedCount < images.length;

      if (shouldInjectMore) {
        for (let i = 0; i < parts.length; i++) {
            newContentParts.push(parts[i]);
            
            const isHeading = parts[i].trim().startsWith('#');
            
            // Try to distribute remaining images
            if (imgIndex < images.length && i < parts.length - 1) {
                // Check if this part already has an image
                const partHasImage = /!\[.*?\]\(.*?\)/.test(parts[i]);
                
                if (!partHasImage && (isHeading || (i > 2 && i % 4 === 0))) {
                    newContentParts.push(`![${images[imgIndex].title}](${images[imgIndex].url})`);
                    imgIndex++;
                }
            }
        }
        content = newContentParts.join('\n\n');
      }
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web)
      .map((web: any) => ({ title: web.title, uri: web.uri })) || [];

    const extractYouTubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const sourceVideos = sources
        .filter((s: any) => s.uri && (s.uri.includes('youtube.com') || s.uri.includes('youtu.be')))
        .map((s: any) => ({
            title: s.title,
            videoId: extractYouTubeId(s.uri)
        }))
        .filter((v: any) => v.videoId);

    let modelVideos = json.youtubeVideos || [];
    const allVideos = [...sourceVideos];
    const existingIds = new Set(allVideos.map(v => v.videoId));

    modelVideos.forEach((v: any) => {
        if (v.videoId && v.videoId.length === 11 && !existingIds.has(v.videoId)) {
            allVideos.push(v);
            existingIds.add(v.videoId);
        }
    });

    return { content, sources, videos: allVideos, images };
  } catch (error) {
    console.error("Error generating lesson content:", error);
    return { content: "", sources: [], videos: [], images: [] };
  }
};

export const generateLessonFromFile = async (
  lessonTitle: string,
  language: Language,
  fileData: { mimeType: string, data: string }
): Promise<{ content: string; videos: { title: string; videoId: string }[]; images: { title: string; url: string }[] }> => {
  const langPrompt = language === 'vi' ? 'Vietnamese' : 'English';
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: fileData.mimeType,
                    data: fileData.data
                }
            },
            {
                text: `You are an expert educational content creator. 
                Task: Create a detailed lesson content for the lesson titled "${lessonTitle}" based on the attached document.
                Language: ${langPrompt}.
                Format: Markdown.
                Instructions:
                - Extract key information relevant to the lesson title from the document.
                - Structure it with clear headings, bullet points, and paragraphs.
                - Ensure it is comprehensive, easy to learn, and well-formatted.
                - Do NOT just summarize; teach the material found in the document.
                - USE GOOGLE SEARCH to find 1-2 relevant YouTube videos and 2-3 relevant educational images.
                - EMBED the images DIRECTLY into the Markdown content using syntax \`![Alt Text](URL)\`.`
            }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: FILE_LESSON_SCHEMA,
      }
    });
    const json = JSON.parse(response.text || "{}");
    
    let content = (json.markdownContent || "").replace(/\\n/g, '\n');
    const images = json.images || [];
    
    if (images.length > 0) {
      const contentParts = content.split('\n\n');
      let imgIndex = 0;
      let newContentParts = [];
      let imagesEmbeddedCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;

      const shouldInjectMore = imagesEmbeddedCount < images.length;

      if (shouldInjectMore) {
        for (let i = 0; i < contentParts.length; i++) {
            newContentParts.push(contentParts[i]);
            const isHeading = contentParts[i].trim().startsWith('#');
            if (imgIndex < images.length && i < contentParts.length - 1) {
                const partHasImage = /!\[.*?\]\(.*?\)/.test(contentParts[i]);
                if (!partHasImage && (isHeading || (i > 2 && i % 4 === 0))) {
                    newContentParts.push(`![${images[imgIndex].title}](${images[imgIndex].url})`);
                    imgIndex++;
                }
            }
        }
        content = newContentParts.join('\n\n');
      }
    }

    return {
        content: content,
        videos: json.youtubeVideos || [],
        images: images
    };
  } catch (error) {
      console.error("Error generating lesson from file:", error);
      return { content: "", videos: [], images: [] };
  }
}

export const verifyLessonContent = async (content: string, language: Language): Promise<VerificationResult> => {
  const langPrompt = language === 'vi' ? 'Vietnamese' : 'English';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Verify educational content in ${langPrompt}:\n${content.substring(0, 1000)}`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: VERIFICATION_SCHEMA,
      }
    });
    const json = JSON.parse(response.text || "{}");
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web)
      .map((web: any) => ({ title: web.title, uri: web.uri })) || [];
    return {
      status: json.status || 'ACCURATE',
      analysis: json.analysis || 'Verification complete.',
      suggestedCorrections: json.suggestedCorrections,
      sources: sources
    };
  } catch (error) {
    return { status: 'ACCURATE', analysis: "", sources: [] };
  }
};

export const chatWithTutor = async (history: { role: 'user' | 'model', text: string }[], message: string, language: Language) => {
  const langInstruction = language === 'vi' ? 'Vietnamese' : 'English';
  try {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        config: { systemInstruction: `You are Neuro AI tutor in ${langInstruction}.` }
      });
      const result = await chat.sendMessage({ message });
      return result.text;
  } catch (error) {
      return "";
  }
}
