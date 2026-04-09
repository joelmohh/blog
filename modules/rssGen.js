const express = require('express');
const Router = express.Router();

Router.get('/', async (req, res) => {
    const BLOG_URL = process.env.BLOG_URL || 'http://localhost:3000';
    const G_USERNAME = process.env.G_USERNAME;
    const G_REPONAME = process.env.G_REPONAME;

    function nameToData(name) {
        const baseName = name.replace('.md', '');
        const day = baseName.substring(0, 2);
        const monthStr = baseName.substring(2, 5);
        const year = baseName.substring(5, 9);
        const hour = baseName.substring(9, 11);
        const min = baseName.substring(11, 13);

        const months = {
            JAN: 0, FEB: 1, MAR: 2, APR: 3,
            MAY: 4, JUN: 5, JUL: 6, AUG: 7,
            SEP: 8, OCT: 9, NOV: 10, DEC: 11
        };

        const date = new Date(year, months[monthStr], day, hour, min);
        return { date, day, monthStr, year };
    }

    function parsePost(content) {
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

    try {
        const response = await fetch(
            `https://api.github.com/repos/${G_USERNAME}/${G_REPONAME}/contents/posts?ref=main`
        );

        const posts = await response.json();

        const postsData = await Promise.all(
            posts
                .filter(post => post.type === 'file' && post.name.endsWith('.md'))
                .map(async (post) => {
                    const postResponse = await fetch(post.download_url);
                    const postContent = await postResponse.text();

                    const data = parsePost(postContent);
                    const { date } = nameToData(post.name);
                    const slug = post.name.replace('.md', '');

                    return { ...data, date, slug };
                })
        );
        console.log(postsData[0].DESCRIPTION);
        const items = postsData
            .sort((a, b) => b.date - a.date)
            .map(({ TITLE, DESCRIPTION, slug, date }) => `
                <item>
                    <title>${TITLE || slug}</title>
                    <link>${BLOG_URL}/posts/${slug}</link>
                    <guid>${BLOG_URL}/posts/${slug}</guid>
                    <pubDate>${date.toUTCString()}</pubDate>
                    <description>${DESCRIPTION || ''}</description>
                </item>
            `)
            .join('');
        

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

        res.set('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        res.status(500).send('Error generating RSS feed');
    }
});

module.exports = Router;