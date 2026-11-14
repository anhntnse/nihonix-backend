/**
 * Detailed Grammar Sub-Topics Seed Data
 * Based on Minna no Nihongo curriculum
 * 
 * Structure: Mỗi topic có 3-5 grammar sub-topics phù hợp
 */

export const detailedGrammarSubTopicsData = {
  // ============================================
  // N5 LEVEL - 25 Topics
  // ============================================
  N5: {
    // Topic 1: Greetings (Lời chào)
    'greetings': [
      {
        slug: 'basic-patterns-greetings',
        grammar_type: 'basic-patterns',
        title: { vi: 'Cấu trúc cơ bản', en: 'Basic Patterns', jp: '基本構造' },
        description: { 
          vi: 'Các mẫu câu cơ bản trong lời chào hỏi',
          en: 'Basic sentence patterns for greetings',
          jp: '挨拶の基本的な文型'
        },
        order: 1
      },
      {
        slug: 'polite-forms-greetings',
        grammar_type: 'polite-forms',
        title: { vi: 'Thể lịch sự', en: 'Polite Forms', jp: '丁寧形' },
        description: { 
          vi: 'Cách dùng です/ます trong lời chào',
          en: 'Using です/ます in greetings',
          jp: '挨拶でのです・ます形'
        },
        order: 2
      },
      {
        slug: 'time-based-greetings',
        grammar_type: 'expressions',
        title: { vi: 'Chào theo thời gian', en: 'Time-based Greetings', jp: '時間別の挨拶' },
        description: { 
          vi: 'おはよう、こんにちは、こんばんは',
          en: 'Morning, afternoon, evening greetings',
          jp: '朝・昼・晩の挨拶'
        },
        order: 3
      }
    ],

    // Topic 2: Numbers (Số đếm)
    'numbers': [
      {
        slug: 'counting-basics',
        grammar_type: 'numbers',
        title: { vi: 'Đếm cơ bản', en: 'Basic Counting', jp: '数え方の基本' },
        description: { 
          vi: 'Số từ 1-10000, いち、に、さん...',
          en: 'Numbers 1-10000',
          jp: '一、二、三...'
        },
        order: 1
      },
      {
        slug: 'counters-basic',
        grammar_type: 'counters',
        title: { vi: 'Số đếm vật', en: 'Object Counters', jp: '助数詞' },
        description: { 
          vi: '〜つ、〜個、〜本、〜枚',
          en: 'Counters for objects',
          jp: 'つ、個、本、枚'
        },
        order: 2
      },
      {
        slug: 'numbers-in-sentences',
        grammar_type: 'particles',
        title: { vi: 'Số trong câu', en: 'Numbers in Sentences', jp: '文中の数字' },
        description: { 
          vi: 'Cách dùng số với các trợ từ',
          en: 'Using numbers with particles',
          jp: '助詞と数字の使い方'
        },
        order: 3
      }
    ],

    // Topic 3: Time (Thời gian)
    'time': [
      {
        slug: 'telling-time',
        grammar_type: 'expressions',
        title: { vi: 'Nói giờ', en: 'Telling Time', jp: '時刻の言い方' },
        description: { 
          vi: '〜時〜分、何時ですか',
          en: 'Hours and minutes',
          jp: '時・分の表現'
        },
        order: 1
      },
      {
        slug: 'time-particles',
        grammar_type: 'particles',
        title: { vi: 'Trợ từ thời gian', en: 'Time Particles', jp: '時間の助詞' },
        description: { 
          vi: 'に、まで、から、〜に〜ます',
          en: 'Particles used with time',
          jp: 'に、まで、から'
        },
        order: 2
      },
      {
        slug: 'time-expressions',
        grammar_type: 'vocabulary',
        title: { vi: 'Cụm từ thời gian', en: 'Time Expressions', jp: '時間表現' },
        description: { 
          vi: '今、今日、明日、昨日、毎日',
          en: 'Now, today, tomorrow, yesterday',
          jp: '時間に関する表現'
        },
        order: 3
      }
    ],

    // Topic 4: Family (Gia đình)
    'family': [
      {
        slug: 'family-members-basic',
        grammar_type: 'vocabulary',
        title: { vi: 'Thành viên gia đình', en: 'Family Members', jp: '家族の呼び方' },
        description: { 
          vi: '父、母、兄、姉、弟、妹',
          en: 'Father, mother, siblings',
          jp: '家族の言葉'
        },
        order: 1
      },
      {
        slug: 'family-polite-humble',
        grammar_type: 'keigo',
        title: { vi: 'Cách nói lịch sự', en: 'Polite/Humble Forms', jp: '敬語と謙譲語' },
        description: { 
          vi: 'お父さん vs 父、ご家族 vs 家族',
          en: 'Polite vs humble family terms',
          jp: '家族の敬語'
        },
        order: 2
      },
      {
        slug: 'possession-family',
        grammar_type: 'particles',
        title: { vi: 'Sở hữu', en: 'Possession', jp: '所有' },
        description: { 
          vi: 'の を使って家族を紹介',
          en: 'Using の to show possession',
          jp: 'の助詞'
        },
        order: 3
      }
    ],

    // Topic 5: Food (Đồ ăn)
    'food': [
      {
        slug: 'food-vocabulary',
        grammar_type: 'vocabulary',
        title: { vi: 'Từ vựng đồ ăn', en: 'Food Vocabulary', jp: '食べ物の語彙' },
        description: { 
          vi: 'Các loại đồ ăn, thức uống cơ bản',
          en: 'Basic food and drinks',
          jp: '基本的な食べ物・飲み物'
        },
        order: 1
      },
      {
        slug: 'ordering-food',
        grammar_type: 'expressions',
        title: { vi: 'Gọi món', en: 'Ordering Food', jp: '注文する' },
        description: { 
          vi: '〜をお願いします、〜をください',
          en: 'Ordering patterns',
          jp: '注文の表現'
        },
        order: 2
      },
      {
        slug: 'food-preferences',
        grammar_type: 'adjectives',
        title: { vi: 'Sở thích ăn uống', en: 'Food Preferences', jp: '好み' },
        description: { 
          vi: '好き、嫌い、おいしい、まずい',
          en: 'Like, dislike, delicious',
          jp: '好き嫌いの表現'
        },
        order: 3
      },
      {
        slug: 'food-particles',
        grammar_type: 'particles',
        title: { vi: 'Trợ từ với đồ ăn', en: 'Particles with Food', jp: '食べ物の助詞' },
        description: { 
          vi: 'を、が、に、で trong ngữ cảnh ăn uống',
          en: 'Particles in food context',
          jp: '食事での助詞の使い方'
        },
        order: 4
      }
    ],

    // Topic 6: Daily Activities (Hoạt động hàng ngày)
    'daily-activities': [
      {
        slug: 'daily-verbs',
        grammar_type: 'verbs',
        title: { vi: 'Động từ hàng ngày', en: 'Daily Verbs', jp: '日常動詞' },
        description: { 
          vi: '起きる、食べる、行く、来る、見る',
          en: 'Wake up, eat, go, come, see',
          jp: '毎日使う動詞'
        },
        order: 1
      },
      {
        slug: 'verb-conjugation-masu',
        grammar_type: 'conjugation',
        title: { vi: 'Chia động từ ます', en: 'Masu Form', jp: 'ます形' },
        description: { 
          vi: 'します、食べます、行きます',
          en: 'Polite verb forms',
          jp: '動詞のます形'
        },
        order: 2
      },
      {
        slug: 'time-with-activities',
        grammar_type: 'particles',
        title: { vi: 'Thời gian + Hoạt động', en: 'Time + Activities', jp: '時間と行動' },
        description: { 
          vi: '7時に起きます、12時に食べます',
          en: 'Combining time with actions',
          jp: '時刻と動作'
        },
        order: 3
      }
    ],

    // Topic 7: Colors (Màu sắc)
    'colors': [
      {
        slug: 'color-adjectives',
        grammar_type: 'adjectives',
        title: { vi: 'Tính từ màu sắc', en: 'Color Adjectives', jp: '色の形容詞' },
        description: { 
          vi: '赤い、青い、白い、黒い、黄色い',
          en: 'い-adjectives for colors',
          jp: 'い形容詞の色'
        },
        order: 1
      },
      {
        slug: 'color-nouns',
        grammar_type: 'vocabulary',
        title: { vi: 'Danh từ màu sắc', en: 'Color Nouns', jp: '色の名詞' },
        description: { 
          vi: '緑、茶色、ピンク、オレンジ',
          en: 'Colors as nouns with の',
          jp: '名詞としての色'
        },
        order: 2
      },
      {
        slug: 'describing-objects',
        grammar_type: 'patterns',
        title: { vi: 'Mô tả vật', en: 'Describing Objects', jp: '物の説明' },
        description: { 
          vi: '〜は〜いです、〜の〜',
          en: 'Object is color-adjective',
          jp: '色での物の説明'
        },
        order: 3
      }
    ],

    // Topic 8: Body Parts (Bộ phận cơ thể)
    'body-parts': [
      {
        slug: 'body-vocabulary',
        grammar_type: 'vocabulary',
        title: { vi: 'Từ vựng cơ thể', en: 'Body Vocabulary', jp: '体の部位' },
        description: { 
          vi: '頭、顔、目、鼻、口、手、足',
          en: 'Head, face, eyes, nose, mouth',
          jp: '体の名称'
        },
        order: 1
      },
      {
        slug: 'body-pain-expressions',
        grammar_type: 'expressions',
        title: { vi: 'Diễn đạt đau', en: 'Pain Expressions', jp: '痛みの表現' },
        description: { 
          vi: '〜が痛い、〜が痛いです',
          en: 'My ~ hurts',
          jp: '痛みを伝える'
        },
        order: 2
      },
      {
        slug: 'body-actions',
        grammar_type: 'verbs',
        title: { vi: 'Hành động cơ thể', en: 'Body Actions', jp: '体の動作' },
        description: { 
          vi: '見る、聞く、話す、食べる、歩く',
          en: 'See, hear, speak, eat, walk',
          jp: '体を使う動詞'
        },
        order: 3
      }
    ],

    // Topic 9: Weather (Thời tiết)
    'weather': [
      {
        slug: 'weather-vocabulary',
        grammar_type: 'vocabulary',
        title: { vi: 'Từ vựng thời tiết', en: 'Weather Vocabulary', jp: '天気の語彙' },
        description: { 
          vi: '晴れ、雨、雪、曇り、風',
          en: 'Sunny, rain, snow, cloudy, wind',
          jp: '天気の言葉'
        },
        order: 1
      },
      {
        slug: 'weather-expressions',
        grammar_type: 'patterns',
        title: { vi: 'Mẫu câu thời tiết', en: 'Weather Patterns', jp: '天気の文型' },
        description: { 
          vi: '今日は〜です、明日は〜でしょう',
          en: 'Today is ~, tomorrow will be ~',
          jp: '天気を言う文型'
        },
        order: 2
      },
      {
        slug: 'temperature',
        grammar_type: 'numbers',
        title: { vi: 'Nhiệt độ', en: 'Temperature', jp: '温度' },
        description: { 
          vi: '〜度、暑い、寒い、涼しい、暖かい',
          en: 'Degrees, hot, cold, cool, warm',
          jp: '温度の表現'
        },
        order: 3
      }
    ],

    // Topic 10: School (Trường học)
    'school': [
      {
        slug: 'school-vocabulary',
        grammar_type: 'vocabulary',
        title: { vi: 'Từ vựng trường học', en: 'School Vocabulary', jp: '学校の語彙' },
        description: { 
          vi: '学校、教室、先生、学生、授業',
          en: 'School, classroom, teacher, student',
          jp: '学校に関する言葉'
        },
        order: 1
      },
      {
        slug: 'school-activities',
        grammar_type: 'verbs',
        title: { vi: 'Hoạt động học tập', en: 'Study Activities', jp: '勉強の活動' },
        description: { 
          vi: '勉強する、読む、書く、聞く、話す',
          en: 'Study, read, write, listen, speak',
          jp: '勉強する動詞'
        },
        order: 2
      },
      {
        slug: 'school-subjects',
        grammar_type: 'vocabulary',
        title: { vi: 'Môn học', en: 'School Subjects', jp: '科目' },
        description: { 
          vi: '数学、英語、歴史、科学',
          en: 'Math, English, history, science',
          jp: '学校の科目'
        },
        order: 3
      }
    ],

    // Topic 11-25: Simplified for now, will expand later
    'transportation': [
      { slug: 'transport-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Phương tiện', en: 'Vehicles', jp: '乗り物' }, order: 1 },
      { slug: 'transport-verbs', grammar_type: 'verbs', title: { vi: 'Động từ di chuyển', en: 'Movement Verbs', jp: '移動動詞' }, order: 2 },
      { slug: 'transport-particles', grammar_type: 'particles', title: { vi: 'Trợ từ で、に、を', en: 'Particles で、に、を', jp: '助詞' }, order: 3 }
    ],

    'clothing': [
      { slug: 'clothing-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Quần áo', en: 'Clothes', jp: '服' }, order: 1 },
      { slug: 'wearing-verbs', grammar_type: 'verbs', title: { vi: '着る、履く、被る', en: 'Wear verbs', jp: '着る動詞' }, order: 2 },
      { slug: 'clothing-adjectives', grammar_type: 'adjectives', title: { vi: 'Mô tả quần áo', en: 'Describing clothes', jp: '服の形容' }, order: 3 }
    ],

    'hobbies': [
      { slug: 'hobby-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Sở thích', en: 'Hobbies', jp: '趣味' }, order: 1 },
      { slug: 'hobby-expressions', grammar_type: 'expressions', title: { vi: '〜が好きです', en: 'Like expressions', jp: '好きの表現' }, order: 2 },
      { slug: 'frequency-adverbs', grammar_type: 'adverbs', title: { vi: 'よく、時々、全然', en: 'Frequency', jp: '頻度副詞' }, order: 3 }
    ],

    'shopping': [
      { slug: 'shopping-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Mua sắm', en: 'Shopping', jp: '買い物' }, order: 1 },
      { slug: 'buying-selling', grammar_type: 'verbs', title: { vi: '買う、売る', en: 'Buy, sell', jp: '買う・売る' }, order: 2 },
      { slug: 'price-expressions', grammar_type: 'patterns', title: { vi: 'いくらですか', en: 'Price patterns', jp: '値段の表現' }, order: 3 }
    ],

    'directions': [
      { slug: 'direction-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Phương hướng', en: 'Directions', jp: '方向' }, order: 1 },
      { slug: 'location-particles', grammar_type: 'particles', title: { vi: 'に、で、を', en: 'Location particles', jp: '場所の助詞' }, order: 2 },
      { slug: 'giving-directions', grammar_type: 'expressions', title: { vi: 'Chỉ đường', en: 'Giving directions', jp: '道案内' }, order: 3 }
    ],

    'health': [
      { slug: 'health-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Sức khỏe', en: 'Health', jp: '健康' }, order: 1 },
      { slug: 'illness-expressions', grammar_type: 'patterns', title: { vi: '病気の表現', en: 'Illness expressions', jp: '病気の言い方' }, order: 2 }
    ],

    'work': [
      { slug: 'work-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Công việc', en: 'Work', jp: '仕事' }, order: 1 },
      { slug: 'job-titles', grammar_type: 'vocabulary', title: { vi: 'Nghề nghiệp', en: 'Job titles', jp: '職業' }, order: 2 }
    ],

    'travel': [
      { slug: 'travel-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Du lịch', en: 'Travel', jp: '旅行' }, order: 1 },
      { slug: 'travel-verbs', grammar_type: 'verbs', title: { vi: '行く、来る、帰る', en: 'Go, come, return', jp: '移動動詞' }, order: 2 }
    ],

    'animals': [
      { slug: 'animal-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Động vật', en: 'Animals', jp: '動物' }, order: 1 }
    ],

    'nature': [
      { slug: 'nature-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Thiên nhiên', en: 'Nature', jp: '自然' }, order: 1 }
    ],

    'emotions': [
      { slug: 'emotion-adjectives', grammar_type: 'adjectives', title: { vi: 'Cảm xúc', en: 'Emotions', jp: '感情' }, order: 1 },
      { slug: 'emotion-expressions', grammar_type: 'expressions', title: { vi: '嬉しい、悲しい', en: 'Happy, sad', jp: '感情表現' }, order: 2 }
    ],

    'places': [
      { slug: 'place-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Địa điểm', en: 'Places', jp: '場所' }, order: 1 },
      { slug: 'existence-verbs', grammar_type: 'verbs', title: { vi: 'ある、いる', en: 'Existence verbs', jp: '存在動詞' }, order: 2 }
    ],

    'household': [
      { slug: 'household-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Đồ gia dụng', en: 'Household items', jp: '家庭用品' }, order: 1 }
    ],

    'seasons': [
      { slug: 'season-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Mùa', en: 'Seasons', jp: '季節' }, order: 1 }
    ],

    'festivals': [
      { slug: 'festival-vocabulary', grammar_type: 'vocabulary', title: { vi: 'Lễ hội', en: 'Festivals', jp: '祭り' }, order: 1 }
    ]
  }
};

