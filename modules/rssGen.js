const fs = require('fs');
const path = require('path');

const BLOG_URL = process.env.BLOG_URL || 'http://localhost:3000';

function nameToData(name) {
    const day = name.substring(0, 2);
    const monthStr = name.substring(2, 5);
    const year = name.substring(5, 9);
    const hour = name.substring(9, 11);
    const min = name.substring(11, 13);

    const months = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3,
        MAY: 4, JUN: 5, JUL: 6, AUG: 7,
        SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    const date = new Date(year, months[monthStr], day, hour, min);
    return { date, day, monthStr, year };
}

function parsePost(content, filename) {
    const [metaPart, contentPart = ''] = content.split('CONTENT:');
    const lines = metaPart.split('\n');
    const data = {};
    lines.forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!key || !rest.length) return;
        data[key.trim()] = rest.join(':').trim();
    });
    data.CONTENT = contentPart.trim();
    return data;
}

const postsDir = path.join(__dirname, '../posts');
const files = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .sort((a, b) => {
        const { date: da } = nameToData(a);
        const { date: db } = nameToData(b);
        return db - da;
    });

const items = files.map(filename => {
    const content = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
    const data = parsePost(content, filename);
    const { date } = nameToData(filename);
    const slug = filename.replace('.md', '');

    return `
    <item>
        <title>${data.TITLE || slug}</title>
        <link>${BLOG_URL}/posts/${slug}</link>
        <guid>${BLOG_URL}/posts/${slug}</guid>
        <pubDate>${date.toUTCString()}</pubDate>
        <description>${data.DESCRIPTION || ''}</description>
    </item>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>Joelmo's Blog</title>
        <link>${BLOG_URL}</link>
        <description>Personal blog with ideas about development, product and the internet.</description>
        <language>en</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${items}
    </channel>
</rss>`;

fs.writeFileSync(path.join(__dirname, '../public/feed.xml'), xml);
console.log(`RSS generated with ${files.length} posts.`);