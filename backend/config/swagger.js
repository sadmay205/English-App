const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'EnglishAI — API Documentation',
    version: '1.0.0',
    description:
      'RESTful API cho ứng dụng học tiếng Anh thông minh tích hợp AI Chatbot.\n\n' +
      '**Xác thực:** Hầu hết các endpoint yêu cầu JWT Token. Đăng nhập tại `/api/auth/login` để lấy token, ' +
      'sau đó nhấn nút **Authorize** 🔓 và nhập `Bearer <token>` vào trường value.\n\n' +
      '**Rate Limit:** Endpoint `/api/auth/*` giới hạn 20 request / 15 phút.',
    contact: {
      name: 'EnglishAI Dev Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập JWT token lấy được từ /api/auth/login. Format: Bearer <token>',
      },
    },
    schemas: {
      // ─── Error Response ───
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Không tìm thấy tài nguyên' },
          stack: { type: 'string', description: 'Chỉ hiển thị trong development' },
        },
      },

      // ─── Auth ───
      RegisterRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', example: 'student01' },
          email: { type: 'string', format: 'email', example: 'student01@example.com' },
          password: { type: 'string', format: 'password', example: 'secureP@ss123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['emailOrUsername', 'password'],
        properties: {
          emailOrUsername: { type: 'string', example: 'student01', description: 'Username hoặc email' },
          password: { type: 'string', format: 'password', example: 'secureP@ss123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
          username: { type: 'string', example: 'student01' },
          email: { type: 'string', example: 'student01@example.com' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
        },
      },

      // ─── Vocabulary Set ───
      VocabSet: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
          user: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
          title: { type: 'string', example: 'IELTS Academic Vocabulary' },
          description: { type: 'string', example: 'Chủ đề: Education, Technology' },
          lastStudiedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          wordCount: { type: 'integer', example: 25 },
        },
      },
      CreateSetRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'TOEIC Part 5 Vocabulary' },
          description: { type: 'string', example: 'Từ vựng thường gặp trong Part 5' },
        },
      },
      UpdateSetRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated Title' },
          description: { type: 'string', example: 'Updated description' },
        },
      },

      // ─── Vocabulary Item ───
      Vocabulary: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665b2c3d4e5f6a7b8c9d0e1f' },
          vocabSet: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
          word: { type: 'string', example: 'Abundant' },
          phonetic: { type: 'string', example: '/əˈbʌndənt/' },
          meaningVi: { type: 'string', example: 'Nhiều, phong phú, dồi dào' },
          exampleSentence: { type: 'string', example: 'Natural resources are abundant in this region.' },
          exampleMeaningVi: { type: 'string', example: 'Tài nguyên thiên nhiên rất phong phú ở khu vực này.' },
          englishDefinition: { type: 'string', example: 'Existing in large quantities; more than enough.' },
        },
      },
      AddVocabularyRequest: {
        type: 'object',
        required: ['vocabSetId', 'word', 'meaningVi'],
        properties: {
          vocabSetId: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
          word: { type: 'string', example: 'Abundant' },
          phonetic: { type: 'string', example: '/əˈbʌndənt/' },
          meaningVi: { type: 'string', example: 'Nhiều, phong phú, dồi dào' },
          exampleSentence: { type: 'string', example: 'Natural resources are abundant.' },
          exampleMeaningVi: { type: 'string', example: 'Tài nguyên thiên nhiên rất phong phú.' },
          englishDefinition: { type: 'string', example: 'Existing in large quantities.' },
        },
      },
      UpdateVocabularyRequest: {
        type: 'object',
        properties: {
          word: { type: 'string', example: 'Abundance' },
          phonetic: { type: 'string', example: '/əˈbʌndəns/' },
          meaningVi: { type: 'string', example: 'Sự phong phú, sự dồi dào' },
          exampleSentence: { type: 'string' },
          exampleMeaningVi: { type: 'string' },
          englishDefinition: { type: 'string' },
        },
      },

      // ─── PDF Upload Response ───
      PdfUploadResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Đã import 15 từ vựng từ PDF' },
          count: { type: 'integer', example: 15 },
          groups: {
            type: 'array',
            items: { type: 'string' },
            example: ['Education', 'Technology'],
          },
          vocabularies: {
            type: 'array',
            items: { $ref: '#/components/schemas/Vocabulary' },
          },
        },
      },

      // ─── Merge / Split ───
      MergeSetsRequest: {
        type: 'object',
        required: ['sourceSetId', 'targetSetId'],
        properties: {
          sourceSetId: { type: 'string', example: '665a...', description: 'Bộ nguồn (sẽ bị xóa)' },
          targetSetId: { type: 'string', example: '665b...', description: 'Bộ đích (nhận thêm từ)' },
        },
      },
      SplitSetRequest: {
        type: 'object',
        required: ['sourceSetId', 'wordIds', 'newSetTitle'],
        properties: {
          sourceSetId: { type: 'string', example: '665a...' },
          wordIds: {
            type: 'array',
            items: { type: 'string' },
            example: ['665b...', '665c...'],
            description: 'Danh sách ID các từ cần tách',
          },
          newSetTitle: { type: 'string', example: 'Vocabulary - Week 2' },
          newSetDescription: { type: 'string', example: 'Từ vựng tuần 2' },
        },
      },

      // ─── Quiz ───
      MultipleChoiceQuestion: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['multiple-choice-vie', 'multiple-choice-en'] },
          question: { type: 'string', example: 'Abundant' },
          phonetic: { type: 'string', example: '/əˈbʌndənt/' },
          options: {
            type: 'array',
            items: { type: 'string' },
            example: ['Hiếm có', 'Nhiều, phong phú', 'Nhỏ bé', 'Khó khăn'],
          },
          correctIndex: { type: 'integer', example: 1 },
          correctAnswer: { type: 'string', example: 'Nhiều, phong phú' },
        },
      },
      FillBlankQuestion: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['fill-blank', 'fill-blank-en'] },
          hint: { type: 'string', example: 'A______t' },
          phonetic: { type: 'string' },
          correctAnswer: { type: 'string', example: 'Abundant' },
          wordLength: { type: 'integer', example: 8 },
          meaningVi: { type: 'string', example: 'Nhiều, phong phú' },
          englishDefinition: { type: 'string' },
        },
      },
      MatchingQuestion: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['matching', 'matching-en'] },
          word: { type: 'string', example: 'Abundant' },
          phonetic: { type: 'string' },
          meaningVi: { type: 'string' },
          englishDefinition: { type: 'string' },
        },
      },
      QuizResponse: {
        type: 'object',
        properties: {
          setId: { type: 'string' },
          setTitle: { type: 'string', example: 'IELTS Academic Vocabulary' },
          type: { type: 'string', example: 'multiple-choice-vie' },
          totalQuestions: { type: 'integer', example: 10 },
          questions: {
            type: 'array',
            items: {
              oneOf: [
                { $ref: '#/components/schemas/MultipleChoiceQuestion' },
                { $ref: '#/components/schemas/FillBlankQuestion' },
                { $ref: '#/components/schemas/MatchingQuestion' },
              ],
            },
          },
        },
      },
      SubmitQuizRequest: {
        type: 'object',
        required: ['quizType', 'score', 'totalQuestions'],
        properties: {
          vocabSetId: { type: 'string', description: 'ID bộ từ vựng (nếu quiz vocab)' },
          listeningTaskId: { type: 'string', description: 'ID listening task (nếu quiz listening)' },
          quizType: {
            type: 'string',
            enum: [
              'multiple-choice', 'multiple-choice-vie', 'multiple-choice-en',
              'fill-blank', 'fill-blank-en', 'matching', 'matching-en',
              'smart-study', 'listening-complete', 'listening-quiz', 'custom',
            ],
            example: 'multiple-choice-vie',
          },
          score: { type: 'integer', example: 8 },
          totalQuestions: { type: 'integer', example: 10 },
        },
      },
      SubmitQuizResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Đã lưu kết quả' },
          progress: { $ref: '#/components/schemas/Progress' },
          percentage: { type: 'integer', example: 80 },
        },
      },
      CustomQuizRequest: {
        type: 'object',
        required: ['setId', 'typesConfig'],
        properties: {
          setId: { type: 'string', example: '665a...' },
          wordIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lọc từ vựng cụ thể (tùy chọn, mảng ID từ)',
          },
          typesConfig: {
            type: 'object',
            description: 'Số câu mỗi loại quiz',
            example: {
              'multiple-choice-vie': 5,
              'fill-blank': 3,
              'matching': 2,
            },
          },
          timeLimit: { type: 'integer', description: 'Thời gian giới hạn (phút)' },
        },
      },

      // ─── Progress ───
      Progress: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          user: { type: 'string' },
          vocabSetId: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
            },
          },
          listeningTaskId: {
            type: 'object',
            nullable: true,
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
            },
          },
          quizType: { type: 'string', example: 'multiple-choice-vie' },
          score: { type: 'integer', example: 8 },
          totalQuestions: { type: 'integer', example: 10 },
          completedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── Listening ───
      Sentence: {
        type: 'object',
        properties: {
          text: { type: 'string', example: 'The solar system consists of the Sun.' },
          audioUrl: { type: 'string', example: '' },
        },
      },
      ListeningTask: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          user: { type: 'string' },
          title: { type: 'string', example: 'The Solar System' },
          paragraphText: {
            type: 'string',
            example: 'The solar system consists of the Sun. It has eight planets. Each planet has unique features.',
          },
          sentences: {
            type: 'array',
            items: { $ref: '#/components/schemas/Sentence' },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ProcessParagraphRequest: {
        type: 'object',
        required: ['title', 'paragraphText'],
        properties: {
          title: { type: 'string', example: 'The Solar System' },
          paragraphText: {
            type: 'string',
            example: 'The solar system consists of the Sun. It has eight planets. Each planet has unique features.',
          },
        },
      },

      // ─── AI Chat ───
      ChatMessage: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['user', 'assistant'], example: 'user' },
          content: { type: 'string', example: 'How do I use "have been" correctly?' },
        },
      },
      ChatRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChatMessage' },
            description: 'Toàn bộ lịch sử hội thoại (để giữ ngữ cảnh)',
          },
        },
      },
      ChatResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'object',
            properties: {
              role: { type: 'string', example: 'assistant' },
              content: { type: 'string', example: '"Have been" is used with present perfect...' },
            },
          },
          usage: {
            type: 'object',
            properties: {
              prompt_tokens: { type: 'integer', example: 150 },
              completion_tokens: { type: 'integer', example: 200 },
              total_tokens: { type: 'integer', example: 350 },
            },
          },
        },
      },

      // ─── Generic ───
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },

  // ────────────────────────────────────────
  //  PATHS (All API Endpoints)
  // ────────────────────────────────────────
  paths: {
    // ═══════════ HEALTH ═══════════
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health Check',
        description: 'Kiểm tra server đang hoạt động.',
        responses: {
          200: {
            description: 'Server đang hoạt động',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    message: { type: 'string', example: 'English Learning App API is running' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ═══════════ AUTH ═══════════
    '/api/auth/register': {
      post: {
        tags: ['🔑 Authentication'],
        summary: 'Đăng ký tài khoản mới',
        description: 'Tạo tài khoản người dùng mới. Password sẽ được hash bằng bcrypt (12 rounds).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Đăng ký thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: {
            description: 'Thiếu thông tin hoặc username/email đã tồn tại',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['🔑 Authentication'],
        summary: 'Đăng nhập',
        description: 'Xác thực bằng username hoặc email + password. Trả về JWT token (hạn 30 ngày).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Đăng nhập thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: {
            description: 'Sai thông tin đăng nhập',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },

    // ═══════════ VOCABULARY SETS ═══════════
    '/api/vocabulary/sets': {
      get: {
        tags: ['📚 Vocabulary'],
        summary: 'Lấy tất cả bộ từ vựng',
        description: 'Lấy danh sách bộ từ vựng của user hiện tại, kèm wordCount. Sắp xếp theo lastStudiedAt giảm dần.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Danh sách bộ từ vựng',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/VocabSet' } },
              },
            },
          },
          401: { description: 'Chưa xác thực' },
        },
      },
      post: {
        tags: ['📚 Vocabulary'],
        summary: 'Tạo bộ từ vựng mới',
        description: 'Tạo một bộ từ vựng trống mới.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSetRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tạo bộ từ thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/VocabSet' } } },
          },
          400: { description: 'Thiếu title' },
        },
      },
    },
    '/api/vocabulary/sets/{id}': {
      get: {
        tags: ['📚 Vocabulary'],
        summary: 'Lấy chi tiết bộ từ vựng',
        description: 'Lấy thông tin bộ từ kèm toàn bộ danh sách từ vựng bên trong.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'VocabSet ID' },
        ],
        responses: {
          200: {
            description: 'Chi tiết bộ từ + vocabularies',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/VocabSet' },
                    {
                      type: 'object',
                      properties: {
                        vocabularies: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Vocabulary' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
      put: {
        tags: ['📚 Vocabulary'],
        summary: 'Cập nhật bộ từ vựng',
        description: 'Cập nhật title và/hoặc description của bộ từ.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateSetRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Cập nhật thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/VocabSet' } } } },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
      delete: {
        tags: ['📚 Vocabulary'],
        summary: 'Xóa bộ từ vựng',
        description: 'Xóa bộ từ vựng và tất cả từ vựng bên trong.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Xóa thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
    },

    // ═══════════ VOCABULARY ITEMS ═══════════
    '/api/vocabulary/item': {
      post: {
        tags: ['📚 Vocabulary'],
        summary: 'Thêm từ vựng mới',
        description: 'Thêm một từ vựng vào bộ từ chỉ định.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddVocabularyRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Thêm từ thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Vocabulary' } } },
          },
          400: { description: 'Thiếu thông tin bắt buộc' },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
    },
    '/api/vocabulary/item/{id}': {
      put: {
        tags: ['📚 Vocabulary'],
        summary: 'Cập nhật từ vựng',
        description: 'Cập nhật thông tin một từ vựng (word, phonetic, meaningVi,...).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Vocabulary ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateVocabularyRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Cập nhật thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vocabulary' } } } },
          404: { description: 'Không tìm thấy từ vựng' },
          403: { description: 'Không có quyền' },
        },
      },
      delete: {
        tags: ['📚 Vocabulary'],
        summary: 'Xóa từ vựng',
        description: 'Xóa một từ vựng khỏi bộ từ.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Vocabulary ID' },
        ],
        responses: {
          200: { description: 'Xóa thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } } },
          404: { description: 'Không tìm thấy từ vựng' },
          403: { description: 'Không có quyền' },
        },
      },
    },

    // ═══════════ PDF UPLOAD ═══════════
    '/api/vocabulary/upload-pdf': {
      post: {
        tags: ['📚 Vocabulary'],
        summary: 'Upload PDF → parse từ vựng',
        description:
          'Upload file PDF chứa danh sách từ vựng. Hệ thống tự động parse và lưu vào bộ từ vựng chỉ định.\n\n' +
          '**Format PDF khuyến nghị:**\n' +
          '```\nAbundant /əˈbʌndənt/ (adj): Nhiều, phong phú, dồi dào\n```\n' +
          'Giới hạn: 10MB, chỉ chấp nhận file `.pdf`.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['pdf', 'vocabSetId'],
                properties: {
                  pdf: { type: 'string', format: 'binary', description: 'File PDF (max 10MB)' },
                  vocabSetId: { type: 'string', description: 'ID bộ từ vựng đích' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Import thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PdfUploadResponse' } } },
          },
          400: { description: 'File không hợp lệ hoặc không tìm thấy từ vựng' },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
    },

    // ═══════════ GENERATE DEFINITIONS ═══════════
    '/api/vocabulary/sets/{setId}/generate-definitions': {
      post: {
        tags: ['📚 Vocabulary'],
        summary: 'AI sinh định nghĩa tiếng Anh',
        description: 'Dùng AI (OpenRouter) để tự động tạo định nghĩa tiếng Anh cho các từ chưa có. Xử lý theo batch 15 từ.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'setId', in: 'path', required: true, schema: { type: 'string' }, description: 'VocabSet ID' },
        ],
        responses: {
          200: {
            description: 'Đã sinh definitions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Đã tự động tạo định nghĩa tiếng Anh cho 10 từ vựng!' },
                    count: { type: 'integer', example: 10 },
                    vocabularies: { type: 'array', items: { $ref: '#/components/schemas/Vocabulary' } },
                  },
                },
              },
            },
          },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
    },

    // ═══════════ MERGE / SPLIT ═══════════
    '/api/vocabulary/merge': {
      post: {
        tags: ['📚 Vocabulary'],
        summary: 'Gộp 2 bộ từ vựng',
        description: 'Di chuyển tất cả từ từ bộ nguồn (source) sang bộ đích (target), sau đó xóa bộ nguồn.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MergeSetsRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Gộp thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    sourceSetId: { type: 'string' },
                    targetSetId: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Thiếu thông tin hoặc 2 bộ giống nhau' },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
    },
    '/api/vocabulary/split': {
      post: {
        tags: ['📚 Vocabulary'],
        summary: 'Tách từ ra bộ mới',
        description: 'Tách các từ vựng đã chọn từ bộ nguồn sang một bộ mới.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SplitSetRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tách thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    newSet: { $ref: '#/components/schemas/VocabSet' },
                    sourceSetId: { type: 'string' },
                    splitCount: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { description: 'Thiếu thông tin' },
          404: { description: 'Không tìm thấy bộ nguồn' },
        },
      },
    },

    // ═══════════ QUIZ ═══════════
    '/api/quiz/generate/{setId}': {
      get: {
        tags: ['📝 Quiz'],
        summary: 'Sinh quiz từ bộ từ vựng',
        description:
          'Tạo bài kiểm tra ngẫu nhiên từ bộ từ vựng. Cần tối thiểu **4 từ** trong bộ.\n\n' +
          'Các loại quiz có suffix `-en` yêu cầu từ vựng đã có `englishDefinition` (dùng tính năng AI sinh definitions trước).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'setId', in: 'path', required: true, schema: { type: 'string' }, description: 'VocabSet ID' },
          {
            name: 'type',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['multiple-choice-vie', 'multiple-choice-en', 'fill-blank', 'fill-blank-en', 'matching', 'matching-en'],
              default: 'multiple-choice-vie',
            },
            description: 'Loại quiz',
          },
          {
            name: 'count',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Số câu hỏi (tối đa = số từ trong bộ)',
          },
        ],
        responses: {
          200: {
            description: 'Quiz được sinh thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/QuizResponse' } } },
          },
          400: { description: 'Bộ từ ít hơn 4 từ' },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
    },
    '/api/quiz/generate-custom': {
      post: {
        tags: ['📝 Quiz'],
        summary: 'Sinh quiz tùy chỉnh',
        description: 'Tạo bài quiz kết hợp nhiều loại câu hỏi. Có thể lọc từ vựng cụ thể bằng wordIds.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CustomQuizRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Quiz tùy chỉnh được sinh thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/QuizResponse' } } },
          },
          400: { description: 'Thiếu thông tin hoặc không đủ từ vựng' },
          404: { description: 'Không tìm thấy bộ từ' },
        },
      },
    },
    '/api/quiz/submit': {
      post: {
        tags: ['📝 Quiz'],
        summary: 'Gửi kết quả quiz',
        description: 'Gửi kết quả làm bài để chấm điểm và lưu vào lịch sử Progress.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubmitQuizRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Kết quả đã được lưu',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitQuizResponse' } } },
          },
          400: { description: 'Thiếu thông tin bắt buộc' },
        },
      },
    },
    '/api/quiz/progress': {
      get: {
        tags: ['📝 Quiz'],
        summary: 'Lấy lịch sử điểm số',
        description: 'Lấy 50 bản ghi progress gần nhất. Có thể lọc theo setId hoặc taskId.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'setId', in: 'query', schema: { type: 'string' }, description: 'Lọc theo VocabSet ID (tùy chọn)' },
          { name: 'taskId', in: 'query', schema: { type: 'string' }, description: 'Lọc theo ListeningTask ID (tùy chọn)' },
        ],
        responses: {
          200: {
            description: 'Danh sách progress',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Progress' } },
              },
            },
          },
        },
      },
    },

    // ═══════════ LISTENING ═══════════
    '/api/listening/process-paragraph': {
      post: {
        tags: ['🎧 Listening'],
        summary: 'Tạo bài tập nghe từ đoạn văn',
        description: 'Gửi đoạn văn → hệ thống tự động tách thành mảng câu (regex-based) và lưu thành ListeningTask.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProcessParagraphRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Tạo listening task thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ListeningTask' } } },
          },
          400: { description: 'Thiếu thông tin hoặc không tách được câu' },
        },
      },
    },
    '/api/listening/tasks': {
      get: {
        tags: ['🎧 Listening'],
        summary: 'Lấy tất cả bài tập nghe',
        description: 'Lấy danh sách listening tasks của user, sắp xếp theo createdAt giảm dần.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Danh sách listening tasks',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ListeningTask' } },
              },
            },
          },
        },
      },
    },
    '/api/listening/tasks/{id}': {
      get: {
        tags: ['🎧 Listening'],
        summary: 'Lấy chi tiết bài tập nghe',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ListeningTask ID' },
        ],
        responses: {
          200: {
            description: 'Chi tiết listening task',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ListeningTask' } } },
          },
          404: { description: 'Không tìm thấy' },
        },
      },
      delete: {
        tags: ['🎧 Listening'],
        summary: 'Xóa bài tập nghe',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ListeningTask ID' },
        ],
        responses: {
          200: {
            description: 'Xóa thành công',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } } },
          },
          404: { description: 'Không tìm thấy' },
        },
      },
    },

    // ═══════════ AI CHATBOT ═══════════
    '/api/ai/chat': {
      post: {
        tags: ['🤖 AI Chatbot'],
        summary: 'Chat với AI English Tutor',
        description:
          'Gửi lịch sử hội thoại đến AI (qua OpenRouter). AI đóng vai giáo viên tiếng Anh chuyên nghiệp.\n\n' +
          'Gửi toàn bộ mảng `messages` để giữ ngữ cảnh hội thoại liên tục. Response ở dạng **Markdown**.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatRequest' },
              example: {
                messages: [
                  { role: 'user', content: 'Giải thích giúp mình cách dùng "have been" nhé!' },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Phản hồi từ AI',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatResponse' } } },
          },
          400: { description: 'Thiếu mảng messages' },
          502: { description: 'AI service không phản hồi' },
        },
      },
    },
  },

  tags: [
    { name: 'Health', description: 'Kiểm tra trạng thái server' },
    { name: '🔑 Authentication', description: 'Đăng ký / Đăng nhập — Rate limited: 20 req / 15 phút' },
    { name: '📚 Vocabulary', description: 'CRUD bộ từ vựng, từ vựng, upload PDF, merge/split, AI definitions' },
    { name: '📝 Quiz', description: 'Sinh quiz (trắc nghiệm, điền từ, matching), chấm điểm, lịch sử' },
    { name: '🎧 Listening', description: 'Tạo bài tập nghe từ đoạn văn, tách câu tự động' },
    { name: '🤖 AI Chatbot', description: 'Hỏi đáp với AI giáo viên tiếng Anh (OpenRouter)' },
  ],
};

// swagger-jsdoc cần options, nhưng vì ta đã inline toàn bộ spec nên apis rỗng
const options = {
  swaggerDefinition,
  apis: [], // Không dùng JSDoc annotations — đã inline hết vào swaggerDefinition
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
