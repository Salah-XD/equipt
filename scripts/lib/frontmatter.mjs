import matter from 'gray-matter';

export function parseFrontmatter(content) {
  const parsed = matter(content);
  return { data: parsed.data, body: parsed.content };
}
