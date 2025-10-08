import OpenAI from 'openai';

export class LLMService {
  constructor() {
    this.openrouter = null; // lazy init
  }

  ensureClient() {
    if (!this.openrouter) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is missing. Add it to your environment to enable LLM features.');
      }
      this.openrouter = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost',
          'X-Title': 'StudyMate-AI'
        }
      });
    }
  }

  async generateRAGAnswer(query, passages) {
    try {
      this.ensureClient();
      const context = passages.map(p => 
        `[${p.docTitle}, p.${p.pageNo}]: "${p.snippet}"`
      ).join('\n\n');

      const systemPrompt = `You are an educational assistant helping Class 11 students. When answering, always:
- Return a concise answer (1–3 paragraphs)
- Provide citations in this format: According to [DocTitle] p. <page>: "<2–3 line quote>"
- If deriving or explaining, include a short step-by-step explanation and a final summary sentence
- If the question cannot be answered from the provided sources, say: "I couldn't find a direct answer in the provided texts; here's a concise explanation based on general physics knowledge." and mark it as external`;

      const userPrompt = `Question: ${query}

Context passages (retrieved):
${context}

Generate answer with citations and show which passage you used for each statement.`;

      const response = await this.openrouter.chat.completions.create({
        model: process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating RAG answer:', error);
      throw new Error('Failed to generate answer');
    }
  }

  async generateQuizQuestions(passages, numQuestions = 10, distribution = { mcq: 6, saq: 3, laq: 1 }) {
    try {
      this.ensureClient();
      const context = passages.map(p => 
        `[${p.docTitle}, p.${p.pageNo}]: "${p.snippet}"`
      ).join('\n\n');

      const systemPrompt = `You are an exam-style question generator for Class 11 Physics. For each selected passage, generate:
- MCQs: question stem, 4 choices (one correct), brief explanation (1–2 lines), difficulty (easy/medium/hard)
- SAQs: 2–4 sentence answer expected
- LAQs: prompt + bullet points of expected detailed answer (3–6 bullets)
Make distractors plausible: use common student misconceptions or close numeric values. Return JSON with fields: type, stem, choices, correct_index, explanation, source_doc, page_no, difficulty`;

      const userPrompt = `Generate ${numQuestions} questions from the following passages with distribution: MCQ:${distribution.mcq}, SAQ:${distribution.saq}, LAQ:${distribution.laq}

Context passages:
${context}

Return as JSON array.`;

      const response = await this.openrouter.chat.completions.create({
        model: process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });
      const content = response.choices[0].message.content;
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return this.generateHeuristicQuestions(passages, numQuestions, distribution);
      }
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      return this.generateHeuristicQuestions(passages, numQuestions, distribution);
    }
  }

  // Heuristic fallback quiz generation when LLM is unavailable
  generateHeuristicQuestions(passages, numQuestions, distribution) {
    const textPool = passages.map(p => ({
      source_doc: p.docTitle || 'Unknown',
      page_no: p.pageNo || 1,
      text: (p.snippet || p.text || '').replace(/\s+/g, ' ').trim()
    }));
    const sentences = [];
    for (const item of textPool) {
      const splits = item.text.split(/[.!?]\s+/).filter(s => s.length > 20);
      for (const s of splits) sentences.push({ ...item, sentence: s });
    }
    function pick(arr, n) {
      const copy = [...arr];
      const out = [];
      while (copy.length && out.length < n) {
        out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
      }
      return out;
    }

    const makeMCQ = (s) => {
      const words = s.sentence.split(/\s+/).filter(w => w.length > 3);
      const answer = words[Math.floor(words.length / 2)] || words[0] || 'physics';
      const stem = `In the context of the passage, which word best completes: "${s.sentence.replace(answer, '_____')}"?`;
      const distractors = pick(words.filter(w => w !== answer), 3);
      const choices = [answer, ...distractors];
      for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
      return {
        type: 'MCQ',
        stem,
        choices,
        correct_index: choices.indexOf(answer),
        explanation: 'The missing word is the original term in the sentence.',
        source_doc: s.source_doc,
        page_no: s.page_no,
        difficulty: 'easy'
      };
    };

    const makeSAQ = (s) => ({
      type: 'SAQ',
      stem: `Briefly explain the key idea of: "${s.sentence}"`,
      correct_answer: 'Answers may vary; summarize the key idea.',
      explanation: 'Checks conceptual understanding of the passage.',
      source_doc: s.source_doc,
      page_no: s.page_no,
      difficulty: 'medium'
    });

    const makeLAQ = (s) => ({
      type: 'LAQ',
      stem: `Discuss the concept and provide 3–5 bullet points: "${s.sentence}"`,
      correct_answer: 'A structured explanation with multiple relevant points.',
      explanation: 'Evaluates deeper understanding and organization.',
      source_doc: s.source_doc,
      page_no: s.page_no,
      difficulty: 'hard'
    });

    const targetMcq = Math.min(distribution.mcq || 0, numQuestions);
    const targetSaq = Math.min(distribution.saq || 0, Math.max(0, numQuestions - targetMcq));
    const targetLaq = Math.max(0, numQuestions - targetMcq - targetSaq);

    const selected = pick(sentences, targetMcq + targetSaq + targetLaq);
    const mcqs = selected.slice(0, targetMcq).map(makeMCQ);
    const saqs = selected.slice(targetMcq, targetMcq + targetSaq).map(makeSAQ);
    const laqs = selected.slice(targetMcq + targetSaq).map(makeLAQ);
    return [...mcqs, ...saqs, ...laqs];
  }

  async generateChatResponse(message, context = '') {
    try {
      this.ensureClient();
      const systemPrompt = `You are StudyMate, an educational assistant for Class 11 students. Help them understand physics concepts, answer questions, and provide study guidance. Be encouraging and clear in your explanations.`;

      const userPrompt = context ? 
        `Context: ${context}\n\nStudent question: ${message}` :
        `Student question: ${message}`;

      const response = await this.openrouter.chat.completions.create({
        model: process.env.OPENROUTER_CHAT_MODEL || 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw new Error('Failed to generate chat response');
    }
  }
}
