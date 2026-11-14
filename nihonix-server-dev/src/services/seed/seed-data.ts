// Seed data cho Levels, Topics và Grammar Sub-topics dựa trên tài liệu chuẩn JLPT N5-N1
export const levelsSeedData = [
  { code: 'N5' as const, name: { vi: 'Sơ cấp', en: 'Beginner', jp: '初級' } },
  {
    code: 'N4' as const,
    name: { vi: 'Sơ trung cấp', en: 'Elementary', jp: '初級中級' },
  },
  {
    code: 'N3' as const,
    name: { vi: 'Trung cấp', en: 'Intermediate', jp: '中級' },
  },
  {
    code: 'N2' as const,
    name: { vi: 'Trung cao cấp', en: 'Upper Intermediate', jp: '中上級' },
  },
  { code: 'N1' as const, name: { vi: 'Cao cấp', en: 'Advanced', jp: '上級' } },
];

export const topicsSeedData = {
  N5: [
    {
      slug: 'greetings',
      title: { vi: 'Lời chào hỏi', en: 'Greetings', jp: '挨拶' },
      order: 1,
    },
    {
      slug: 'numbers',
      title: { vi: 'Số đếm', en: 'Numbers', jp: '数字' },
      order: 2,
    },
    {
      slug: 'time',
      title: { vi: 'Thời gian', en: 'Time', jp: '時間' },
      order: 3,
    },
    {
      slug: 'family',
      title: { vi: 'Gia đình', en: 'Family', jp: '家族' },
      order: 4,
    },
    {
      slug: 'food',
      title: { vi: 'Đồ ăn', en: 'Food', jp: '食べ物' },
      order: 5,
    },
    {
      slug: 'daily-activities',
      title: {
        vi: 'Hoạt động hàng ngày',
        en: 'Daily Activities',
        jp: '日常活動',
      },
      order: 6,
    },
    {
      slug: 'colors',
      title: { vi: 'Màu sắc', en: 'Colors', jp: '色' },
      order: 7,
    },
    {
      slug: 'body-parts',
      title: { vi: 'Bộ phận cơ thể', en: 'Body Parts', jp: '体の部位' },
      order: 8,
    },
    {
      slug: 'weather',
      title: { vi: 'Thời tiết', en: 'Weather', jp: '天気' },
      order: 9,
    },
    {
      slug: 'school',
      title: { vi: 'Trường học', en: 'School', jp: '学校' },
      order: 10,
    },
    {
      slug: 'transportation',
      title: { vi: 'Phương tiện giao thông', en: 'Transportation', jp: '交通' },
      order: 11,
    },
    {
      slug: 'clothing',
      title: { vi: 'Quần áo', en: 'Clothing', jp: '服' },
      order: 12,
    },
    {
      slug: 'hobbies',
      title: { vi: 'Sở thích', en: 'Hobbies', jp: '趣味' },
      order: 13,
    },
    {
      slug: 'shopping',
      title: { vi: 'Mua sắm', en: 'Shopping', jp: '買い物' },
      order: 14,
    },
    {
      slug: 'directions',
      title: { vi: 'Phương hướng', en: 'Directions', jp: '方向' },
      order: 15,
    },
    {
      slug: 'health',
      title: { vi: 'Sức khỏe', en: 'Health', jp: '健康' },
      order: 16,
    },
    {
      slug: 'work',
      title: { vi: 'Công việc', en: 'Work', jp: '仕事' },
      order: 17,
    },
    {
      slug: 'travel',
      title: { vi: 'Du lịch', en: 'Travel', jp: '旅行' },
      order: 18,
    },
    {
      slug: 'animals',
      title: { vi: 'Động vật', en: 'Animals', jp: '動物' },
      order: 19,
    },
    {
      slug: 'nature',
      title: { vi: 'Thiên nhiên', en: 'Nature', jp: '自然' },
      order: 20,
    },
    {
      slug: 'emotions',
      title: { vi: 'Cảm xúc', en: 'Emotions', jp: '感情' },
      order: 21,
    },
    {
      slug: 'places',
      title: { vi: 'Địa điểm', en: 'Places', jp: '場所' },
      order: 22,
    },
    {
      slug: 'household',
      title: { vi: 'Đồ gia dụng', en: 'Household Items', jp: '家庭用品' },
      order: 23,
    },
    {
      slug: 'seasons',
      title: { vi: 'Mùa', en: 'Seasons', jp: '季節' },
      order: 24,
    },
    {
      slug: 'festivals',
      title: { vi: 'Lễ hội', en: 'Festivals', jp: '祭り' },
      order: 25,
    },
  ],
  N4: [
    {
      slug: 'relationships',
      title: { vi: 'Mối quan hệ', en: 'Relationships', jp: '人間関係' },
      order: 1,
    },
    {
      slug: 'entertainment',
      title: { vi: 'Giải trí', en: 'Entertainment', jp: '娯楽' },
      order: 2,
    },
    {
      slug: 'technology',
      title: { vi: 'Công nghệ', en: 'Technology', jp: '技術' },
      order: 3,
    },
    {
      slug: 'sports',
      title: { vi: 'Thể thao', en: 'Sports', jp: 'スポーツ' },
      order: 4,
    },
    {
      slug: 'media',
      title: { vi: 'Truyền thông', en: 'Media', jp: 'メディア' },
      order: 5,
    },
    {
      slug: 'education',
      title: { vi: 'Giáo dục', en: 'Education', jp: '教育' },
      order: 6,
    },
    {
      slug: 'business',
      title: { vi: 'Kinh doanh', en: 'Business', jp: 'ビジネス' },
      order: 7,
    },
    {
      slug: 'communication',
      title: { vi: 'Giao tiếp', en: 'Communication', jp: 'コミュニケーション' },
      order: 8,
    },
    {
      slug: 'housing',
      title: { vi: 'Nhà ở', en: 'Housing', jp: '住居' },
      order: 9,
    },
    {
      slug: 'cooking',
      title: { vi: 'Nấu ăn', en: 'Cooking', jp: '料理' },
      order: 10,
    },
    {
      slug: 'shopping-advanced',
      title: {
        vi: 'Mua sắm nâng cao',
        en: 'Advanced Shopping',
        jp: '高度な買い物',
      },
      order: 11,
    },
    {
      slug: 'banking',
      title: { vi: 'Ngân hàng', en: 'Banking', jp: '銀行' },
      order: 12,
    },
    {
      slug: 'healthcare',
      title: { vi: 'Chăm sóc sức khỏe', en: 'Healthcare', jp: '医療' },
      order: 13,
    },
    {
      slug: 'environment',
      title: { vi: 'Môi trường', en: 'Environment', jp: '環境' },
      order: 14,
    },
    {
      slug: 'social-issues',
      title: { vi: 'Vấn đề xã hội', en: 'Social Issues', jp: '社会問題' },
      order: 15,
    },
    {
      slug: 'career',
      title: { vi: 'Nghề nghiệp', en: 'Career', jp: '職業' },
      order: 16,
    },
    {
      slug: 'fashion',
      title: { vi: 'Thời trang', en: 'Fashion', jp: 'ファッション' },
      order: 17,
    },
    {
      slug: 'music',
      title: { vi: 'Âm nhạc', en: 'Music', jp: '音楽' },
      order: 18,
    },
    {
      slug: 'art',
      title: { vi: 'Nghệ thuật', en: 'Art', jp: '芸術' },
      order: 19,
    },
    {
      slug: 'festivals-culture',
      title: { vi: 'Lễ hội văn hóa', en: 'Cultural Festivals', jp: '文化祭' },
      order: 20,
    },
    {
      slug: 'weather-advanced',
      title: {
        vi: 'Thời tiết nâng cao',
        en: 'Advanced Weather',
        jp: '高度な天気',
      },
      order: 21,
    },
    {
      slug: 'transportation-advanced',
      title: {
        vi: 'Giao thông nâng cao',
        en: 'Advanced Transportation',
        jp: '高度な交通',
      },
      order: 22,
    },
    {
      slug: 'housing-advanced',
      title: { vi: 'Nhà ở nâng cao', en: 'Advanced Housing', jp: '高度な住居' },
      order: 23,
    },
    {
      slug: 'workplace',
      title: { vi: 'Nơi làm việc', en: 'Workplace', jp: '職場' },
      order: 24,
    },
    {
      slug: 'community',
      title: { vi: 'Cộng đồng', en: 'Community', jp: 'コミュニティ' },
      order: 25,
    },
  ],
  N3: [
    {
      slug: 'abstract-concepts',
      title: {
        vi: 'Khái niệm trừu tượng',
        en: 'Abstract Concepts',
        jp: '抽象概念',
      },
      order: 1,
    },
    {
      slug: 'politics',
      title: { vi: 'Chính trị', en: 'Politics', jp: '政治' },
      order: 2,
    },
    {
      slug: 'economy',
      title: { vi: 'Kinh tế', en: 'Economy', jp: '経済' },
      order: 3,
    },
    {
      slug: 'culture',
      title: { vi: 'Văn hóa', en: 'Culture', jp: '文化' },
      order: 4,
    },
    {
      slug: 'science',
      title: { vi: 'Khoa học', en: 'Science', jp: '科学' },
      order: 5,
    },
    {
      slug: 'literature',
      title: { vi: 'Văn học', en: 'Literature', jp: '文学' },
      order: 6,
    },
    {
      slug: 'history',
      title: { vi: 'Lịch sử', en: 'History', jp: '歴史' },
      order: 7,
    },
    {
      slug: 'philosophy',
      title: { vi: 'Triết học', en: 'Philosophy', jp: '哲学' },
      order: 8,
    },
    {
      slug: 'advanced-business',
      title: {
        vi: 'Kinh doanh nâng cao',
        en: 'Advanced Business',
        jp: '高度なビジネス',
      },
      order: 9,
    },
    {
      slug: 'academic',
      title: { vi: 'Học thuật', en: 'Academic', jp: '学術' },
      order: 10,
    },
    {
      slug: 'psychology',
      title: { vi: 'Tâm lý học', en: 'Psychology', jp: '心理学' },
      order: 11,
    },
    {
      slug: 'sociology',
      title: { vi: 'Xã hội học', en: 'Sociology', jp: '社会学' },
      order: 12,
    },
    {
      slug: 'anthropology',
      title: { vi: 'Nhân chủng học', en: 'Anthropology', jp: '人類学' },
      order: 13,
    },
    {
      slug: 'ethics',
      title: { vi: 'Đạo đức học', en: 'Ethics', jp: '倫理学' },
      order: 14,
    },
    {
      slug: 'law',
      title: { vi: 'Luật pháp', en: 'Law', jp: '法律' },
      order: 15,
    },
    {
      slug: 'medicine',
      title: { vi: 'Y học', en: 'Medicine', jp: '医学' },
      order: 16,
    },
    {
      slug: 'engineering',
      title: { vi: 'Kỹ thuật', en: 'Engineering', jp: '工学' },
      order: 17,
    },
    {
      slug: 'mathematics',
      title: { vi: 'Toán học', en: 'Mathematics', jp: '数学' },
      order: 18,
    },
    {
      slug: 'linguistics',
      title: { vi: 'Ngôn ngữ học', en: 'Linguistics', jp: '言語学' },
      order: 19,
    },
    {
      slug: 'religion',
      title: { vi: 'Tôn giáo', en: 'Religion', jp: '宗教' },
      order: 20,
    },
    {
      slug: 'mythology',
      title: { vi: 'Thần thoại', en: 'Mythology', jp: '神話' },
      order: 21,
    },
    {
      slug: 'art-history',
      title: { vi: 'Lịch sử nghệ thuật', en: 'Art History', jp: '美術史' },
      order: 22,
    },
    {
      slug: 'international-relations',
      title: {
        vi: 'Quan hệ quốc tế',
        en: 'International Relations',
        jp: '国際関係',
      },
      order: 23,
    },
    {
      slug: 'media-studies',
      title: {
        vi: 'Nghiên cứu truyền thông',
        en: 'Media Studies',
        jp: 'メディア研究',
      },
      order: 24,
    },
    {
      slug: 'environmental-science',
      title: {
        vi: 'Khoa học môi trường',
        en: 'Environmental Science',
        jp: '環境科学',
      },
      order: 25,
    },
  ],
  N2: [
    {
      slug: 'business-strategy',
      title: {
        vi: 'Chiến lược kinh doanh',
        en: 'Business Strategy',
        jp: '経営戦略',
      },
      order: 1,
    },
    {
      slug: 'corporate-culture',
      title: {
        vi: 'Văn hóa doanh nghiệp',
        en: 'Corporate Culture',
        jp: '企業文化',
      },
      order: 2,
    },
    {
      slug: 'negotiation',
      title: { vi: 'Đàm phán', en: 'Negotiation', jp: '交渉' },
      order: 3,
    },
    {
      slug: 'project-management',
      title: {
        vi: 'Quản lý dự án',
        en: 'Project Management',
        jp: 'プロジェクト管理',
      },
      order: 4,
    },
    {
      slug: 'marketing',
      title: { vi: 'Marketing', en: 'Marketing', jp: 'マーケティング' },
      order: 5,
    },
    {
      slug: 'finance',
      title: { vi: 'Tài chính', en: 'Finance', jp: '金融' },
      order: 6,
    },
    {
      slug: 'accounting',
      title: { vi: 'Kế toán', en: 'Accounting', jp: '会計' },
      order: 7,
    },
    {
      slug: 'human-resources',
      title: { vi: 'Nhân sự', en: 'Human Resources', jp: '人事' },
      order: 8,
    },
    {
      slug: 'logistics',
      title: { vi: 'Hậu cần', en: 'Logistics', jp: '物流' },
      order: 9,
    },
    {
      slug: 'quality-control',
      title: {
        vi: 'Kiểm soát chất lượng',
        en: 'Quality Control',
        jp: '品質管理',
      },
      order: 10,
    },
    {
      slug: 'research-methods',
      title: {
        vi: 'Phương pháp nghiên cứu',
        en: 'Research Methods',
        jp: '研究方法',
      },
      order: 11,
    },
    {
      slug: 'data-analysis',
      title: { vi: 'Phân tích dữ liệu', en: 'Data Analysis', jp: 'データ分析' },
      order: 12,
    },
    {
      slug: 'statistics',
      title: { vi: 'Thống kê', en: 'Statistics', jp: '統計学' },
      order: 13,
    },
    {
      slug: 'information-technology',
      title: {
        vi: 'Công nghệ thông tin',
        en: 'Information Technology',
        jp: '情報技術',
      },
      order: 14,
    },
    {
      slug: 'cybersecurity',
      title: {
        vi: 'An ninh mạng',
        en: 'Cybersecurity',
        jp: 'サイバーセキュリティ',
      },
      order: 15,
    },
    {
      slug: 'artificial-intelligence',
      title: {
        vi: 'Trí tuệ nhân tạo',
        en: 'Artificial Intelligence',
        jp: '人工知能',
      },
      order: 16,
    },
    {
      slug: 'biotechnology',
      title: {
        vi: 'Công nghệ sinh học',
        en: 'Biotechnology',
        jp: 'バイオテクノロジー',
      },
      order: 17,
    },
    {
      slug: 'sustainable-development',
      title: {
        vi: 'Phát triển bền vững',
        en: 'Sustainable Development',
        jp: '持続可能な開発',
      },
      order: 18,
    },
    {
      slug: 'urban-planning',
      title: { vi: 'Quy hoạch đô thị', en: 'Urban Planning', jp: '都市計画' },
      order: 19,
    },
    {
      slug: 'architecture',
      title: { vi: 'Kiến trúc', en: 'Architecture', jp: '建築' },
      order: 20,
    },
    {
      slug: 'design',
      title: { vi: 'Thiết kế', en: 'Design', jp: 'デザイン' },
      order: 21,
    },
    {
      slug: 'journalism',
      title: { vi: 'Báo chí', en: 'Journalism', jp: 'ジャーナリズム' },
      order: 22,
    },
    {
      slug: 'public-speaking',
      title: {
        vi: 'Diễn thuyết công cộng',
        en: 'Public Speaking',
        jp: 'スピーチ',
      },
      order: 23,
    },
    {
      slug: 'leadership',
      title: { vi: 'Lãnh đạo', en: 'Leadership', jp: 'リーダーシップ' },
      order: 24,
    },
    {
      slug: 'innovation',
      title: { vi: 'Đổi mới', en: 'Innovation', jp: 'イノベーション' },
      order: 25,
    },
  ],
  N1: [
    {
      slug: 'advanced-literature',
      title: {
        vi: 'Văn học nâng cao',
        en: 'Advanced Literature',
        jp: '高度な文学',
      },
      order: 1,
    },
    {
      slug: 'literary-criticism',
      title: {
        vi: 'Phê bình văn học',
        en: 'Literary Criticism',
        jp: '文学批評',
      },
      order: 2,
    },
    {
      slug: 'classical-japanese',
      title: {
        vi: 'Tiếng Nhật cổ điển',
        en: 'Classical Japanese',
        jp: '古典日本語',
      },
      order: 3,
    },
    {
      slug: 'poetry',
      title: { vi: 'Thơ ca', en: 'Poetry', jp: '詩' },
      order: 4,
    },
    {
      slug: 'drama',
      title: { vi: 'Kịch', en: 'Drama', jp: '演劇' },
      order: 5,
    },
    {
      slug: 'advanced-philosophy',
      title: {
        vi: 'Triết học nâng cao',
        en: 'Advanced Philosophy',
        jp: '高度な哲学',
      },
      order: 6,
    },
    {
      slug: 'metaphysics',
      title: { vi: 'Siêu hình học', en: 'Metaphysics', jp: '形而上学' },
      order: 7,
    },
    {
      slug: 'epistemology',
      title: { vi: 'Nhận thức luận', en: 'Epistemology', jp: '認識論' },
      order: 8,
    },
    {
      slug: 'ethics-advanced',
      title: {
        vi: 'Đạo đức học nâng cao',
        en: 'Advanced Ethics',
        jp: '高度な倫理学',
      },
      order: 9,
    },
    {
      slug: 'aesthetics',
      title: { vi: 'Mỹ học', en: 'Aesthetics', jp: '美学' },
      order: 10,
    },
    {
      slug: 'international-law',
      title: { vi: 'Luật quốc tế', en: 'International Law', jp: '国際法' },
      order: 11,
    },
    {
      slug: 'constitutional-law',
      title: { vi: 'Luật hiến pháp', en: 'Constitutional Law', jp: '憲法' },
      order: 12,
    },
    {
      slug: 'intellectual-property',
      title: {
        vi: 'Sở hữu trí tuệ',
        en: 'Intellectual Property',
        jp: '知的財産',
      },
      order: 13,
    },
    {
      slug: 'medical-ethics',
      title: { vi: 'Đạo đức y học', en: 'Medical Ethics', jp: '医療倫理' },
      order: 14,
    },
    {
      slug: 'clinical-research',
      title: {
        vi: 'Nghiên cứu lâm sàng',
        en: 'Clinical Research',
        jp: '臨床研究',
      },
      order: 15,
    },
    {
      slug: 'quantum-physics',
      title: { vi: 'Vật lý lượng tử', en: 'Quantum Physics', jp: '量子物理学' },
      order: 16,
    },
    {
      slug: 'theoretical-physics',
      title: {
        vi: 'Vật lý lý thuyết',
        en: 'Theoretical Physics',
        jp: '理論物理学',
      },
      order: 17,
    },
    {
      slug: 'advanced-mathematics',
      title: {
        vi: 'Toán học nâng cao',
        en: 'Advanced Mathematics',
        jp: '高度な数学',
      },
      order: 18,
    },
    {
      slug: 'computational-linguistics',
      title: {
        vi: 'Ngôn ngữ học tính toán',
        en: 'Computational Linguistics',
        jp: '計算言語学',
      },
      order: 19,
    },
    {
      slug: 'sociolinguistics',
      title: {
        vi: 'Ngôn ngữ học xã hội',
        en: 'Sociolinguistics',
        jp: '社会言語学',
      },
      order: 20,
    },
    {
      slug: 'comparative-religion',
      title: {
        vi: 'So sánh tôn giáo',
        en: 'Comparative Religion',
        jp: '比較宗教学',
      },
      order: 21,
    },
    {
      slug: 'theology',
      title: { vi: 'Thần học', en: 'Theology', jp: '神学' },
      order: 22,
    },
    {
      slug: 'diplomacy',
      title: { vi: 'Ngoại giao', en: 'Diplomacy', jp: '外交' },
      order: 23,
    },
    {
      slug: 'global-economics',
      title: {
        vi: 'Kinh tế toàn cầu',
        en: 'Global Economics',
        jp: 'グローバル経済',
      },
      order: 24,
    },
    {
      slug: 'academic-writing',
      title: { vi: 'Viết học thuật', en: 'Academic Writing', jp: '学術論文' },
      order: 25,
    },
  ],
};

export const grammarSubTopicsSeedData = {
  N5: [
    {
      slug: 'basic-patterns',
      title: { vi: 'Cấu trúc cơ bản', en: 'Basic Patterns', jp: '基本構造' },
      order: 1,
    },
    {
      slug: 'particles',
      title: { vi: 'Trợ từ', en: 'Particles', jp: '助詞' },
      order: 2,
    },
    {
      slug: 'verbs',
      title: { vi: 'Động từ', en: 'Verbs', jp: '動詞' },
      order: 3,
    },
    {
      slug: 'adjectives',
      title: { vi: 'Tính từ', en: 'Adjectives', jp: '形容詞' },
      order: 4,
    },
    {
      slug: 'questions',
      title: { vi: 'Câu hỏi', en: 'Questions', jp: '質問' },
      order: 5,
    },
    {
      slug: 'negation',
      title: { vi: 'Phủ định', en: 'Negation', jp: '否定' },
      order: 6,
    },
    {
      slug: 'past-tense',
      title: { vi: 'Quá khứ', en: 'Past Tense', jp: '過去形' },
      order: 7,
    },
    {
      slug: 'desire',
      title: { vi: 'Mong muốn', en: 'Desire', jp: '欲しい' },
      order: 8,
    },
  ],
  N4: [
    {
      slug: 'causative',
      title: { vi: 'Thể sai khiến', en: 'Causative', jp: '使役形' },
      order: 1,
    },
    {
      slug: 'passive',
      title: { vi: 'Thể bị động', en: 'Passive', jp: '受身形' },
      order: 2,
    },
    {
      slug: 'potential',
      title: { vi: 'Thể khả năng', en: 'Potential', jp: '可能形' },
      order: 3,
    },
    {
      slug: 'conditional',
      title: { vi: 'Điều kiện', en: 'Conditional', jp: '条件形' },
      order: 4,
    },
    {
      slug: 'honorifics',
      title: { vi: 'Kính ngữ', en: 'Honorifics', jp: '敬語' },
      order: 5,
    },
    {
      slug: 'comparison',
      title: { vi: 'So sánh', en: 'Comparison', jp: '比較' },
      order: 6,
    },
    {
      slug: 'giving-receiving',
      title: {
        vi: 'Cho và nhận',
        en: 'Giving and Receiving',
        jp: 'あげる・もらう・くれる',
      },
      order: 7,
    },
    {
      slug: 'progressive',
      title: { vi: 'Tiếp diễn', en: 'Progressive', jp: '進行形' },
      order: 8,
    },
  ],
  N3: [
    {
      slug: 'causative-passive',
      title: {
        vi: 'Thể sai khiến bị động',
        en: 'Causative-Passive',
        jp: '使役受身形',
      },
      order: 1,
    },
    {
      slug: 'complex-sentences',
      title: { vi: 'Câu phức', en: 'Complex Sentences', jp: '複文' },
      order: 2,
    },
    {
      slug: 'formal-expressions',
      title: {
        vi: 'Biểu thức trang trọng',
        en: 'Formal Expressions',
        jp: '丁寧表現',
      },
      order: 3,
    },
    {
      slug: 'indirect-speech',
      title: { vi: 'Lời nói gián tiếp', en: 'Indirect Speech', jp: '間接話法' },
      order: 4,
    },
    {
      slug: 'conjunctions',
      title: { vi: 'Liên từ', en: 'Conjunctions', jp: '接続詞' },
      order: 5,
    },
    {
      slug: 'adverbial-clauses',
      title: { vi: 'Mệnh đề trạng ngữ', en: 'Adverbial Clauses', jp: '副詞節' },
      order: 6,
    },
    {
      slug: 'modality',
      title: { vi: 'Tình thái', en: 'Modality', jp: 'モダリティ' },
      order: 7,
    },
    {
      slug: 'nominalization',
      title: { vi: 'Danh từ hóa', en: 'Nominalization', jp: '名詞化' },
      order: 8,
    },
  ],
  N2: [
    {
      slug: 'advanced-causative-passive',
      title: {
        vi: 'Thể sai khiến bị động nâng cao',
        en: 'Advanced Causative-Passive',
        jp: '高度な使役受身形',
      },
      order: 1,
    },
    {
      slug: 'compound-sentences',
      title: {
        vi: 'Câu ghép phức tạp',
        en: 'Compound Sentences',
        jp: '複合文',
      },
      order: 2,
    },
    {
      slug: 'advanced-honorifics',
      title: {
        vi: 'Kính ngữ nâng cao',
        en: 'Advanced Honorifics',
        jp: '高度な敬語',
      },
      order: 3,
    },
    {
      slug: 'formal-writing',
      title: {
        vi: 'Văn viết trang trọng',
        en: 'Formal Writing',
        jp: '正式な文章',
      },
      order: 4,
    },
    {
      slug: 'rhetorical-devices',
      title: {
        vi: 'Biện pháp tu từ',
        en: 'Rhetorical Devices',
        jp: '修辞技法',
      },
      order: 5,
    },
    {
      slug: 'advanced-conjunctions',
      title: {
        vi: 'Liên từ nâng cao',
        en: 'Advanced Conjunctions',
        jp: '高度な接続詞',
      },
      order: 6,
    },
    {
      slug: 'conditional-advanced',
      title: {
        vi: 'Điều kiện nâng cao',
        en: 'Advanced Conditional',
        jp: '高度な条件形',
      },
      order: 7,
    },
    {
      slug: 'passive-advanced',
      title: {
        vi: 'Thể bị động nâng cao',
        en: 'Advanced Passive',
        jp: '高度な受身形',
      },
      order: 8,
    },
  ],
  N1: [
    {
      slug: 'classical-grammar',
      title: {
        vi: 'Ngữ pháp cổ điển',
        en: 'Classical Grammar',
        jp: '古典文法',
      },
      order: 1,
    },
    {
      slug: 'literary-expressions',
      title: {
        vi: 'Biểu thức văn học',
        en: 'Literary Expressions',
        jp: '文学的表現',
      },
      order: 2,
    },
    {
      slug: 'archaic-forms',
      title: { vi: 'Hình thức cổ', en: 'Archaic Forms', jp: '古語形' },
      order: 3,
    },
    {
      slug: 'poetic-language',
      title: { vi: 'Ngôn ngữ thơ ca', en: 'Poetic Language', jp: '詩的言語' },
      order: 4,
    },
    {
      slug: 'advanced-modality',
      title: {
        vi: 'Tình thái nâng cao',
        en: 'Advanced Modality',
        jp: '高度なモダリティ',
      },
      order: 5,
    },
    {
      slug: 'nuanced-expressions',
      title: {
        vi: 'Biểu thức tinh tế',
        en: 'Nuanced Expressions',
        jp: '微妙な表現',
      },
      order: 6,
    },
    {
      slug: 'stylistic-variations',
      title: {
        vi: 'Biến thể phong cách',
        en: 'Stylistic Variations',
        jp: '文体の変異',
      },
      order: 7,
    },
    {
      slug: 'register-shifts',
      title: {
        vi: 'Chuyển đổi ngữ điệu',
        en: 'Register Shifts',
        jp: '語域の転換',
      },
      order: 8,
    },
  ],
};
