# Data Examples

Data examples cho từng table trong database Nihonix.

## Files:

1. **01-levels-examples.json** - Ví dụ data cho bảng `levels`
2. **02-topics-examples.json** - Ví dụ data cho bảng `topics`
3. **03-grammar-sub-topics-examples.json** - Ví dụ data cho bảng `grammar_sub_topics`
4. **04-vocabulary-items-examples.json** - Ví dụ data cho bảng `vocabulary_items`
5. **05-grammar-patterns-examples.json** - Ví dụ data cho bảng `grammar_patterns`
6. **06-entity-sync-examples.json** - Ví dụ data cho bảng `entity_sync`
7. **07-flashcard-folders-examples.json** - Ví dụ data cho bảng `flashcard_folders`
8. **08-flashcards-examples.json** - Ví dụ data cho bảng `flashcards`

## Flow:

### Vocabulary Flow:
```
Level → Topic → Vocabulary Items (trực tiếp)
```

### Grammar Flow:
```
Level → Topic → Grammar Sub-topic → Grammar Patterns
```

### Flashcard Flow:
```
Flashcard Folder → Flashcards (front: từ, back: định nghĩa + ví dụ)
```

## Usage:

Mỗi file JSON chứa array các object mẫu cho table tương ứng. Dùng để:
- Seed data cho database
- Testing
- Reference khi develop API

