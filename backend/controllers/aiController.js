const { chatCompletion } = require('../config/openrouter');

const systemPrompt = `You are an expert AI English Tutor. Your goal is to help Vietnamese students learn English. 
Always respond in a supportive, educational manner. If the user asks in Vietnamese, you can explain grammatical concepts in Vietnamese but provide rich English examples. 
When analyzing mistakes, point out structural flaws and offer corrections clearly.
Format your responses using Markdown for readability. Use bolding, lists, and tables where appropriate to explain concepts clearly.`;

/**
 * @desc    Send chat messages to OpenRouter with a tutoring context
 * @route   POST /api/ai/chat
 */
const chat = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400);
      throw new Error('Yêu cầu cung cấp mảng hội thoại messages');
    }

    // Add system prompt to the beginning of conversation
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await chatCompletion(chatMessages);
    
    if (response && response.choices && response.choices[0]) {
      res.json({
        message: response.choices[0].message,
        usage: response.usage
      });
    } else {
      res.status(502);
      throw new Error('Không nhận được phản hồi hợp lệ từ AI service');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { chat };
