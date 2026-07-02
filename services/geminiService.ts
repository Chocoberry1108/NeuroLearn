
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
    thumbnailUrl: { type: Type.STRING, description: "Leave empty or provide a relevant keyword for the cover image." },
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

    // 1. Try direct parsing
    try {
        return JSON.parse(cleanText);
    } catch (e) {}

    // 2. Extract markdown JSON block if present
    const markdownMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch && markdownMatch[1]) {
        const innerText = markdownMatch[1].trim();
        try {
            return JSON.parse(innerText);
        } catch (e) {
            cleanText = innerText; // Continue trying other methods on the inner text
        }
    }

    // 3. Extract portion between first '{' or '[' and last '}' or ']'
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = cleanText.substring(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(potentialJson);
        } catch (e) {
            cleanText = potentialJson; // Continue trying to recover this portion
        }
    }

    // 4. Manual recovery of truncated JSON
    console.warn("JSON parse failed, attempting manual recovery for:", cleanText.substring(0, 100) + '...');
    
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;
    const cleanChars: string[] = [];

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (escaped) {
            cleanChars.push(char);
            escaped = false;
            continue;
        }
        if (char === '\\') {
            cleanChars.push(char);
            escaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            cleanChars.push(char);
            continue;
        }
        if (inString) {
            cleanChars.push(char);
            continue;
        }
        if (char === '{') {
            openBraces++;
        } else if (char === '}') {
            openBraces--;
        } else if (char === '[') {
            openBrackets++;
        } else if (char === ']') {
            openBrackets--;
        }
        cleanChars.push(char);
    }

    let reconstructed = cleanChars.join('');

    // If we are left in a string, close the string
    if (inString) {
        reconstructed += '"';
    }

    // Trace open brackets/braces to close them in the correct nesting order
    const openStack: ('object' | 'array')[] = [];
    inString = false;
    escaped = false;
    for (let i = 0; i < reconstructed.length; i++) {
        const char = reconstructed[i];
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (char === '{') openStack.push('object');
        else if (char === '[') openStack.push('array');
        else if (char === '}') { if (openStack[openStack.length - 1] === 'object') openStack.pop(); }
        else if (char === ']') { if (openStack[openStack.length - 1] === 'array') openStack.pop(); }
    }

    let tail = '';
    for (let i = openStack.length - 1; i >= 0; i--) {
        if (openStack[i] === 'object') {
            tail += '}';
        } else if (openStack[i] === 'array') {
            tail += ']';
        }
    }

    try {
        return JSON.parse(reconstructed + tail);
    } catch (e) {}

    // Fallback: Try a simpler suffix-based approach
    const suffixes = ['"}', '"]}', '"}]}', '"]}]}', '}', ']}', ']}}'];
    for (const suffix of suffixes) {
        try {
            return JSON.parse(cleanText.trim() + suffix);
        } catch (err) {}
    }

    // Last resort: find last occurrence of a complete brace or bracket and parse
    const lastCurly = cleanText.lastIndexOf('}');
    const lastSquare = cleanText.lastIndexOf(']');
    const cut = Math.max(lastCurly, lastSquare);
    if (cut !== -1) {
        try {
            return JSON.parse(cleanText.substring(0, cut + 1));
        } catch (e) {}
    }

    console.error("All JSON recovery failed.");
    return {};
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
            Include EXACTLY 3 modules, each with EXACTLY 2 lessons.
            Provide a concise, 1-sentence description for each lesson. Do NOT generate detailed content yet.
            
            CRITICAL DESIGN & WRITING RULES:
            1. Write in a natural, engaging, and professional educational tone.
            2. ABSOLUTELY AVOID repetitive phrasing, looping text, or recycling the same words or keywords.
            3. Each module and lesson MUST have a unique, distinct, and descriptive title.
            4. Rely ONLY on the provided file content and your reasoning. Extract any topics or concepts present.
            5. For thumbnailUrl, DO NOT attempt to find real URLs, output an empty string or omit it.`
        });
    } else {
        parts.push({
            text: `Create a brief course structure for the topic: "${topic}". 
            The content MUST be in ${langPrompt} language.
            Include EXACTLY 3 modules, each with EXACTLY 2 lessons.
            Provide a concise 1-sentence description for each lesson. Do NOT generate detailed content yet.
            
            CRITICAL DESIGN & WRITING RULES:
            1. Write in a natural, engaging, and professional educational tone.
            2. ABSOLUTELY AVOID repetitive phrasing, looping text, or recycling the same words or keywords.
            3. Each module and lesson MUST have a unique, distinct, and descriptive title.
            4. USE GOOGLE SEARCH to find a REAL, PUBLICly accessible image URL related to "${topic}" to use as the course \`thumbnailUrl\`. DO NOT hallucinate the URL. MUST NOT BE a base64 or data URI.`
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
      model: 'gemini-3.5-flash',
      contents: parts,
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
      model: 'gemini-3.5-flash',
      contents: `You are an expert tutor writing content for a student in ${langPrompt}.
      
      Topic: Lesson "${lessonTitle}" of course "${courseTitle}".

      INSTRUCTIONS:
      1. Write a comprehensive, deep-dive lesson with a clear logical flow using Markdown. 
      2. **MULTIPLE SOURCES**: SYNTHESIZE your content by actively using GOOGLE SEARCH to gather facts, definitions, and diverse perspectives from AT LEAST 3 DIFFERENT reputable sources (e.g., Wikipedia, official documentation, academic sites, industry blogs) to make the content richer, highly detailed, and more objective.
      3. USE GOOGLE SEARCH to actively find 3-4 REAL, existing educational images from a VARIETY of websites to enrich the visual experience.
      4. **CRITICAL**: Select images from DIFFERENT DOMAINS that have publicly accessible direct image URLs (ending in .png, .jpg, .svg, .gif). DO NOT hallucinate image URLs. If you can't find exact image URLs, use Wikipedia thumbnail links.
      5. CHÈN HÌNH ẢNH MINH HỌA VÀO GIỮA BÀI HỌC (EMBED these images DIRECTLY into the Markdown content using syntax \`![Alt Text](URL)\`). Place each image strategically between paragraphs or after headings to clearly illustrate the concept being discussed, so it acts as an illustrative break.
      6. USE GOOGLE SEARCH with query "site:youtube.com ${lessonTitle}" to find 2 REAL, existing YouTube videos. Their URLs will be automatically extracted from your search references, so just ensure you search for them.
      
      Make the content highly engaging, well-researched, and visually appealing by interleaving text and images.
      
      CRITICAL WRITING REQUIREMENTS:
      - Write in a highly natural, fluent, and professional educational tone.
      - ABSOLUTELY AVOID any repetitive phrasing, loop sentences, or copying/pasting of redundant words.
      - Every paragraph and section must proceed logically and bring new value. No looping text or word repetition allowed.`,
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
      model: 'gemini-3.5-flash',
      contents: [
          {
              inlineData: {
                  mimeType: fileData.mimeType,
                  data: fileData.data
              }
          },
          {
              text: `You are an expert educational content creator. 
              Task: Create detailed, comprehensive, and engaging lesson content for the lesson titled "${lessonTitle}" based purely on the attached document and your logical reasoning.
              Language: ${langPrompt}.
              Format: Markdown.
              
              Instructions:
              - Extract key information relevant to the lesson title from the document.
              - Structure it beautifully with clear headings, bullet points, and paragraphs using Markdown.
              - Ensure it is comprehensive, easy to learn, and well-formatted.
              - Do NOT just summarize; teach the material found in the document in-depth.
              - Analyze any images, charts, or graphs present in the document and describe their crucial points in text where relevant.
              - DO NOT attempt to search for external YouTube videos or Images (leave those fields empty in JSON).
              
              CRITICAL WRITING REQUIREMENTS:
              1. Write in a highly natural, fluent, and professional educational tone.
              2. ABSOLUTELY AVOID any repetitive phrasing, loop sentences, or copying/pasting of redundant words.
              3. Every single paragraph and section must bring new, distinct value and proceed logically. No looping text or word repetition allowed.`
          }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: FILE_LESSON_SCHEMA,
      }
    });

    const responseText = response.text || "";
    const json = parseJsonSafely(responseText);
    
    let content = "";
    let images = [];

    if (json && json.markdownContent) {
        content = json.markdownContent.replace(/\\n/g, '\n');
        images = json.images || [];
    } else {
        // Fallback: If JSON parsing failed, try extracting from potential markdown blocks in responseText
        const markdownMatch = responseText.match(/```(?:json|markdown)?\s*([\s\S]*?)\s*```/i);
        if (markdownMatch && markdownMatch[1]) {
            try {
                const parsed = JSON.parse(markdownMatch[1].trim());
                content = (parsed.markdownContent || "").replace(/\\n/g, '\n');
                images = parsed.images || [];
            } catch (e) {
                // If it's not JSON inside the codeblock, use the block as direct Markdown content
                content = markdownMatch[1].trim();
            }
        } else {
            // Just use the raw text as content
            content = responseText;
        }
    }
    
    if (images.length > 0 && content) {
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
      model: 'gemini-3.5-flash',
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
        model: 'gemini-3.5-flash',
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
