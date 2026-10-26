-- Full-text search. The trigram tokenizer matches substrings in any script, which
-- keeps Malayalam words (vowel signs, ZWJ/ZWNJ) intact; unicode61 would split them.
-- Rows are maintained by application code (src/lib/search) on every article write.
CREATE VIRTUAL TABLE `articles_fts` USING fts5(
	title,
	authors,
	body,
	tokenize = 'trigram'
);
