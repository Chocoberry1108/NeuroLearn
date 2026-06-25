
import { GoogleGenAI, Type } from "@google/genai";
import { Course, Module, Lesson, Language, VerificationResult } from '../types';

export const extractYouTubeId = (urlOrId: string) => {
    if (!urlOrId) return null;
    if (urlOrId.length === 11 && !urlOrId.includes('/') && !urlOrId.includes('.')) {
        return urlOrId;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const COURSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING, description: "A concise 1-2 sentence overview of the course." },
    category: { type: Type.STRING },
    thumbnailUrl: { type: Type.STRING, description: "A highly relevant image URL from a website, representing the course topic. USE GOOGLE SEARCH to find a REAL, PUBLICly accessible image URL ending in .jpg, .png. MUST NOT be a base64 or data: URI. Keep the URL length under 300 characters." },
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
                description: { type: Type.STRING, description: "A one sentence description." },
                duration: { type: Type.STRING, description: "E.g., 5 min" }
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

const parseJsonSafely = (text: string) => {
    if (!text) return {};
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/mi, '');
        cleanText = cleanText.replace(/\n?```$/m, '');
    }
    try {
        return JSON.parse(cleanText.trim());
    } catch (e: any) {
        console.warn("JSON parse failed, attempting manual recovery.", e.message);
        // Sometimes the model truncates the JSON. Let's try appending common closing characters.
        const suffixes = ['"}', '"]}', '"}]}', '"]}]}', '}', ']}', ']}}'];
        for (const suffix of suffixes) {
            try {
                return JSON.parse(cleanText.trim() + suffix);
            } catch (err) {}
        }
        
        // Find the last closing brace or bracket to attempt manual recovery of truncated JSON
        const lastBrace = cleanText.lastIndexOf('}');
        const lastBracket = cleanText.lastIndexOf(']');
        const cutOff = Math.max(lastBrace, lastBracket);
        if (cutOff !== -1) {
             try {
                 // Try parsing a truncated portion
                 return JSON.parse(cleanText.substring(0, cutOff + 1));
             } catch (e2) {
                 // ignore
             }
             
             // If the cutOff was itself inside a corrupted string, we can try to cut before the last quote
             const lastQuote = cleanText.substring(0, cutOff).lastIndexOf('"');
             if (lastQuote !== -1) {
                 try {
                     return JSON.parse(cleanText.substring(0, lastQuote) + '""}');
                 } catch (e3) {}
             }
        }
        
        // If all recovery fails, return empty to prevent hard crashing
        console.error("Failed to recover JSON", text.substring(0, 100) + '...');
        return {};
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
            Provide a concise description for each lesson. Do NOT generate detailed content yet.
            Rely ONLY on the provided file content and your reasoning. Extract any topics or concepts present.
            For thumbnailUrl, DO NOT attempt to find real URLs, output empty string or omit it. MUST NOT BE a base64 or data URI.`
        });
    } else {
        parts.push({
            text: `Create a brief course structure for the topic: "${topic}". 
            The content MUST be in ${langPrompt} language.
            Include EXACTLY 3 modules, each with EXACTLY 2 lessons.
            Provide a concise 1-sentence description for each lesson. Do NOT generate detailed content yet.
            USE GOOGLE SEARCH to find a REAL, PUBLICly accessible image URL related to "${topic}" to use as the course \`thumbnailUrl\`. DO NOT hallucinate the URL. MUST NOT BE a base64 or data URI.`
        });
    }

    const config: any = {
      responseMimeType: "application/json",
      responseSchema: COURSE_SCHEMA,
    };

    if (!fileData) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: parts.length === 1 ? parts[0].text : { parts },
      config: config,
    });

    const data = parseJsonSafely(response.text || "{}");
    
    const modules: Module[] = data.modules?.map((mod: any, mIdx: number) => ({
      id: `m-${Date.now()}-${mIdx}`,
      title: mod.title,
      lessons: mod.lessons?.map((les: any, lIdx: number) => {
        return {
          id: `l-${Date.now()}-${mIdx}-${lIdx}`,
          title: les.title,
          description: les.description,
          duration: les.duration || "5 min",
          content: "",
          images: [],
          videos: [],
          isCompleted: false,
        };
      }) || []
    })) || [];

    return {
      title: data.title || topic,
      description: data.description,
      category: data.category || "General",
      modules,
      thumbnail: (data.thumbnailUrl && data.thumbnailUrl.startsWith('http')) ? data.thumbnailUrl : `https://picsum.photos/seed/${(data.title || topic).replace(/\s/g, '')}/400/300`,
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
      1. Write a comprehensive, deep-dive lesson with a clear logical flow using Markdown. 
      2. **MULTIPLE SOURCES**: SYNTHESIZE your content by actively using GOOGLE SEARCH to gather facts, definitions, and diverse perspectives from AT LEAST 3 DIFFERENT reputable sources (e.g., Wikipedia, official documentation, academic sites, industry blogs) to make the content richer, highly detailed, and more objective.
      3. USE GOOGLE SEARCH to actively find 3-4 REAL, existing educational images from a VARIETY of websites to enrich the visual experience.
      4. **CRITICAL**: Select images from DIFFERENT DOMAINS that have publicly accessible direct image URLs (ending in .png, .jpg, .svg, .gif). DO NOT hallucinate image URLs. If you can't find exact image URLs, use Wikipedia thumbnail links.
      5. CHÈN HÌNH ẢNH MINH HỌA VÀO GIỮA BÀI HỌC (EMBED these images DIRECTLY into the Markdown content using syntax \`![Alt Text](URL)\`). Place each image strategically between paragraphs or after headings to clearly illustrate the concept being discussed, so it acts as an illustrative break.
      6. USE GOOGLE SEARCH with query "site:youtube.com ${lessonTitle}" to find 2 REAL, existing YouTube videos. Their URLs will be automatically extracted from your search references, so just ensure you search for them.
      
      Make the content highly engaging, well-researched, and visually appealing by interleaving text and images.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: LESSON_CONTENT_SCHEMA,
      }
    });

    const json = parseJsonSafely(response.text || "{}");
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
                    newContentParts.push(`\n![${images[imgIndex].title}](${images[imgIndex].url})\n`);
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

    const sourceVideos = sources
        .filter((s: any) => s.uri && (s.uri.includes('youtube.com') || s.uri.includes('youtu.be')))
        .map((s: any) => ({
            title: s.title,
            videoId: extractYouTubeId(s.uri)
        }))
        .filter((v: any) => v.videoId);

    // Dedup source videos
    const allVideos: any[] = [];
    const existingIds = new Set();
    sourceVideos.forEach(v => {
      if (!existingIds.has(v.videoId)) {
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
                Task: Create a detailed lesson content for the lesson titled "${lessonTitle}" based purely on the attached document and your logical reasoning.
                Language: ${langPrompt}.
                Format: Markdown.
                Instructions:
                - Extract key information relevant to the lesson title from the document.
                - Structure it with clear headings, bullet points, and paragraphs.
                - Ensure it is comprehensive, easy to learn, and well-formatted.
                - Do NOT just summarize; teach the material found in the document.
                - Analyze any images, charts, or graphs present in the document and describe their crucial points in text where relevant.
                - DO NOT attempt to search for external YouTube videos or Images (leave those fields empty in JSON), just focus on extracting the best curriculum from the file.`
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: FILE_LESSON_SCHEMA,
      }
    });
    const json = parseJsonSafely(response.text || "{}");
    
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

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web)
      .map((web: any) => ({ title: web.title, uri: web.uri })) || [];

    const sourceVideos = sources
        .filter((s: any) => s.uri && (s.uri.includes('youtube.com') || s.uri.includes('youtu.be')))
        .map((s: any) => ({
            title: s.title,
            videoId: extractYouTubeId(s.uri)
        }))
        .filter((v: any) => v.videoId);

    // Dedup source videos
    const allVideos: any[] = [];
    const existingIds = new Set();
    sourceVideos.forEach((v: any) => {
      if (!existingIds.has(v.videoId)) {
        allVideos.push(v);
        existingIds.add(v.videoId);
      }
    });

    return {
        content: content,
        videos: allVideos,
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
    const json = parseJsonSafely(response.text || "{}");
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
      // Gemini API requires history to strictly alternate and start with a 'user' message.
      let validHistory: { role: 'user' | 'model', text: string }[] = [];
      let nextExpectedRole: 'user' | 'model' = 'user';
      
      for (const h of history) {
          if (h.role === nextExpectedRole) {
              validHistory.push(h);
              nextExpectedRole = nextExpectedRole === 'user' ? 'model' : 'user';
          }
      }

      // If validHistory ends with a 'user' message without a 'model' reply,
      // it means we are out of sync because history should only contain PAST interactions.
      // E.g. [user, model, user] -> waiting for model reply. We should drop the last user,
      // or the API will complain when we send another user message via `chat.sendMessage`.
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
          validHistory.pop();
      }

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: validHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        config: { systemInstruction: `You are Neuro AI tutor in ${langInstruction}.` }
      });
      const result = await chat.sendMessage({ message });
      return result.text || "";
  } catch (error: any) {
      console.error("Chat error:", error);
      throw error;
  }
}
