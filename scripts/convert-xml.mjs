import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const xmlPath = resolve(__dirname, '../corp.xml');
const outPath = resolve(__dirname, '../public/corp-data.json');

const xml = readFileSync(xmlPath, 'utf-8');

const extractTag = (str, tag) => {
  const start = str.indexOf(`<${tag}>`);
  const end = str.indexOf(`</${tag}>`);
  if (start === -1 || end === -1) return '';
  return str.slice(start + tag.length + 2, end).trim();
};

const blocks = xml.split('</list>');
const corps = [];

for (const block of blocks) {
  const listStart = block.indexOf('<list>');
  if (listStart === -1) continue;
  const content = block.slice(listStart);

  const corp_code = extractTag(content, 'corp_code');
  const corp_name = extractTag(content, 'corp_name');
  const corp_eng_name = extractTag(content, 'corp_eng_name');
  const stock_code = extractTag(content, 'stock_code');

  // 비상장사 제외 (stock_code 없음)
  if (!stock_code || stock_code.trim() === '') continue;
  if (!corp_code || !corp_name) continue;

  corps.push({
    c: corp_code,
    n: corp_name,
    e: corp_eng_name,
    s: stock_code.trim(),
  });
}

writeFileSync(outPath, JSON.stringify(corps), 'utf-8');

const sizeKB = Math.round(JSON.stringify(corps).length / 1024);
console.log(`✅ Converted ${corps.length.toLocaleString()} companies to public/corp-data.json (${sizeKB} KB)`);
