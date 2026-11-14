export interface FlashcardPromptParams {
  count: number;
  setName: string;
  levelCode?: string;
  difficulty?: string;
  topic?: string;
}

export const FLASHCARD_PROMPT_TEMPLATE = (params: FlashcardPromptParams): string => {
  const { count, setName, levelCode, difficulty, topic } = params;
  
  // Priority: topic > setName
  // If topic is provided, use it as main context
  // If topic matches setName keywords, mention both for clarity
  const mainContext = topic 
    ? `về chủ đề "${topic}"` 
    : `cho bộ thẻ "${setName}"`;
  
  const levelInfo = levelCode ? `cấp độ ${levelCode}` : '';
  const difficultyInfo = difficulty ? `độ khó ${difficulty}` : '';
  
  // Add setName context only if it provides additional info beyond topic
  const setNameContext = topic && setName.toLowerCase().includes(topic.toLowerCase())
    ? ` (tên bộ: "${setName}")`
    : '';
  
  return `Tạo CHÍNH XÁC ${count} flashcards học TIẾNG NHẬT ${mainContext}${setNameContext} ${levelInfo} ${difficultyInfo}.

LƯU Ý QUAN TRỌNG: 
- Mặt TRƯỚC (front) của flashcard PHẢI LÀ TIẾNG NHẬT (chữ Kanji, Hiragana, Katakana)
- Mặt SAU (back) của flashcard là nghĩa TIẾNG VIỆT
- Đây là flashcards để học TIẾNG NHẬT cho người Việt, KHÔNG PHẢI học tiếng Việt!

QUAN TRỌNG: Bạn PHẢI trả về CHÍNH XÁC ${count} flashcards trong mảng JSON. Không nhiều hơn, không ít hơn. Trả về đúng ${count} flashcards.

CÁC TRƯỜNG BẮT BUỘC (KHÔNG ĐƯỢC NULL HOẶC RỖNG):
- front: object BẮT BUỘC - Mặt trước của flashcard (TIẾNG NHẬT) với các trường:
  * text: string BẮT BUỘC - Văn bản TIẾNG NHẬT (ví dụ: "こんにちは", "ありがとう", "私")
  * type: string BẮT BUỘC - Loại nội dung (mặc định: "text")
  * furigana: string TÙY CHỌN - Cách đọc bằng hiragana (ví dụ: "わたし" cho "私")
  * romaji: string TÙY CHỌN - Phiên âm romaji (ví dụ: "watashi")
  
- back: object BẮT BUỘC - Mặt sau của flashcard (TIẾNG VIỆT) với các trường:
  * text: string BẮT BUỘC - Nghĩa TIẾNG VIỆT (ví dụ: "Xin chào", "Cảm ơn", "Tôi")
  * type: string BẮT BUỘC - Loại nội dung (mặc định: "text")
  * meaning: string TÙY CHỌN - Giải thích chi tiết bằng tiếng Việt
  * example: string TÙY CHỌN - Câu ví dụ bằng TIẾNG NHẬT
  * translation: string TÙY CHỌN - Dịch nghĩa TIẾNG VIỆT của câu ví dụ
  
- order: number BẮT BUỘC - Thứ tự hiển thị (1, 2, 3, ...)

Trả về dưới dạng mảng JSON với CẤU TRÚC CHÍNH XÁC này (TẤT CẢ các trường phải có và không null):
[
  {
    "front": {
      "text": "こんにちは",
      "type": "text",
      "furigana": "こんにちは",
      "romaji": "konnichiwa"
    },
    "back": {
      "text": "Xin chào / Chào buổi chiều",
      "type": "text",
      "meaning": "Lời chào phổ biến trong tiếng Nhật, dùng vào ban ngày",
      "example": "田中さん、こんにちは！",
      "translation": "Chào anh/chị Tanaka!"
    },
    "order": 1
  },
  {
    "front": {
      "text": "ありがとう",
      "type": "text",
      "furigana": "ありがとう",
      "romaji": "arigatou"
    },
    "back": {
      "text": "Cảm ơn",
      "type": "text",
      "meaning": "Lời cảm ơn (thể thường)",
      "example": "手伝ってくれてありがとう。",
      "translation": "Cảm ơn bạn đã giúp đỡ."
    },
    "order": 2
  },
  {
    "front": {
      "text": "私",
      "type": "text",
      "furigana": "わたし",
      "romaji": "watashi"
    },
    "back": {
      "text": "Tôi",
      "type": "text",
      "meaning": "Đại từ ngôi thứ nhất (tôi), dùng phổ biến",
      "example": "私は学生です。",
      "translation": "Tôi là sinh viên."
    },
    "order": 3
  }
]

QUY TẮC QUAN TRỌNG - ĐỌC KỸ:
1. Trả về CHÍNH XÁC ${count} flashcards trong mảng
2. front.text PHẢI là văn bản TIẾNG NHẬT (chữ Kanji, Hiragana, hoặc Katakana) không rỗng cho MỌI flashcard
3. front.type PHẢI là "text" (mặc định)
4. back.text PHẢI là nghĩa TIẾNG VIỆT không rỗng cho MỌI flashcard
5. back.type PHẢI là "text" (mặc định)
6. order PHẢI là số tuần tự bắt đầu từ 1
7. Chỉ trả về mảng JSON hợp lệ, KHÔNG có markdown, KHÔNG có code blocks, KHÔNG có giải thích, KHÔNG có văn bản khác trước hoặc sau mảng JSON
8. KHÔNG được có giá trị null cho các trường BẮT BUỘC
9. Mọi flashcard PHẢI hoàn chỉnh với tất cả các trường bắt buộc được điền đầy đủ
10. Đảm bảo JSON hợp lệ và hoàn chỉnh - không được cắt ngắn hoặc bỏ dở giữa chừng
11. Các trường tùy chọn (furigana, romaji, meaning, example, translation) nên được thêm vào để tăng trải nghiệm học tập
12. NHẮC LẠI: Mặt TRƯỚC phải là TIẾNG NHẬT, mặt SAU là TIẾNG VIỆT!`;
};

export const FLASHCARD_RETRY_PROMPT = (basePrompt: string, count: number): string => {
  return `${basePrompt}\n\nQUAN TRỌNG: Response trước đó có lỗi phân tích JSON. Vui lòng đảm bảo:
1. Trả về CHÍNH XÁC ${count} flashcards trong mảng JSON (không nhiều hơn, không ít hơn)
2. Chỉ trả về mảng JSON hợp lệ (không có markdown, không có code blocks, không có văn bản thêm)
3. MỌI flashcard PHẢI có object front với text là TIẾNG NHẬT (chữ Kanji/Hiragana/Katakana) và type (cả hai đều là string không rỗng)
4. MỌI flashcard PHẢI có object back với text là TIẾNG VIỆT và type (cả hai đều là string không rỗng)
5. MỌI flashcard PHẢI có order là một số (tuần tự: 1, 2, 3, ...)
6. KHÔNG được có giá trị null cho các trường bắt buộc
7. Đảm bảo JSON hoàn chỉnh và hợp lệ - không được cắt ngắn response giữa chừng
8. NHẮC LẠI: Mặt TRƯỚC (front.text) = TIẾNG NHẬT, Mặt SAU (back.text) = TIẾNG VIỆT!`;
};
