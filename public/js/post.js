function nameToData(name) {
    const cleanName = name.replace('.md', '');
    const day = cleanName.substring(0, 2);
    const month = cleanName.substring(2, 5);
    const year = cleanName.substring(5, 9);
    const time = cleanName.substring(9, 13);
    const timeFormatted = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
    const months = {
        JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April',
        MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August',
        SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December'
    };

    return { month: months[month] || month, day, year, time: timeFormatted };
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeUrl(url) {
    if (!url) return null;
    const trimmed = String(url).trim();
    if (!trimmed) return null;

    if (/^(https?:|mailto:|\/|#)/i.test(trimmed) || /^[.]{1,2}\//.test(trimmed)) {
        return trimmed;
    }

    return null;
}

function parsePostFile(raw) {
    const [metaPart, contentPart = ''] = raw.split('CONTENT:');
    const data = { CONTENT: contentPart.trim() };

    metaPart.split('\n').forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!key || !rest.length) return;
        data[key.trim()] = rest.join(':').trim();
    });

    return data;
}

function markdownToHtml(markdown) {
    const markedLib = window.marked;

    if (!markedLib) {
        return `<p>${escapeHtml(markdown || '').replace(/\n/g, '<br>')}</p>`;
    }

    const renderer = new markedLib.Renderer();

    renderer.link = ({ href, title, tokens }) => {
        const safeHref = sanitizeUrl(href);
        const label = markedLib.Parser.parseInline(tokens || []);

        if (!safeHref) return label;

        const external = /^https?:/i.test(safeHref);
        const rel = external ? 'noopener noreferrer' : 'noopener';
        const target = external ? ' target="_blank"' : '';
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';

        return `<a href="${escapeHtml(safeHref)}" rel="${rel}"${target}${titleAttr}>${label}</a>`;
    };

    renderer.image = ({ href, title, text }) => {
        const safeSrc = sanitizeUrl(href);
        if (!safeSrc) return '';

        const alt = escapeHtml(text || '');
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapeHtml(safeSrc)}" alt="${alt}" loading="lazy" decoding="async"${titleAttr}>`;
    };

    markedLib.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false,
        renderer
    });

    const rawHtml = markedLib.parse(markdown || '');
    if (!window.DOMPurify) return rawHtml;

    return window.DOMPurify.sanitize(rawHtml, {
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
        FORBID_ATTR: ['onerror', 'onclick', 'onload', 'style']
    });
}

function renderPost(main, slug, data) {
    const time = nameToData(slug);
    const safeTitle = escapeHtml(data.TITLE || slug);
    const safeCategory = escapeHtml(data.CATEGORY || 'Post');
    const safeDescription = escapeHtml(data.DESCRIPTION || '');
    const safeImageUrl = sanitizeUrl(data.IMAGE_URL);
    const safeImageAlt = escapeHtml(data.TITLE || 'Post cover');

    document.title = `${data.TITLE || slug} - Joelmo's Blog`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta && data.DESCRIPTION) {
        descriptionMeta.setAttribute('content', safeDescription);
    }

    const markdownHtml = data.CONTENT
        ? markdownToHtml(data.CONTENT)
        : '<p><em>No content available.</em></p>';

    main.innerHTML = `
        <section class="post-hero">
            <div class="container">
                <a class="back-link" href="/">All posts</a>
                <div class="post-meta-row">
                    <p class="eyebrow" style="margin:0">${safeCategory}</p>
                    <span class="dot">·</span>
                    <time>${time.month} ${time.day}, ${time.year} at ${time.time}</time>
                </div>
                <h1 class="post-title">${safeTitle}</h1>
                ${safeDescription ? `<p class="post-description">${safeDescription}</p>` : ''}
                ${safeImageUrl ? `
                <figure class="post-cover">
                    <img src="${escapeHtml(safeImageUrl)}" alt="${safeImageAlt}" width="1200" height="525" decoding="async">
                </figure>` : ''}
            </div>
        </section>

        <section class="post-body">
            <div class="container">
                <article class="post-content markdown-body">
                    ${markdownHtml}
                </article>
            </div>
        </section>
    `;
}

function showError(container, title, message) {
    container.innerHTML = `
        <div class="post-error container">
            <strong>${escapeHtml(title)}</strong>
            <p>${message}</p>
            <a class="back-link" href="./index.html" style="margin-top:16px;display:inline-flex">Back to home</a>
        </div>
    `;
}

async function loadPost() {
    const main = document.getElementById('post-main');
    const slug = window.location.pathname.split('/post/')[1];

    if (!slug) {
        showError(main, 'Post not found', 'No post specified in the URL.');
        return;
    }

    const filename = slug.endsWith('.md') ? slug : `${slug}.md`;

    try {
        const res = await fetch(`/api/posts/${filename}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const raw = await res.text();
        const data = parsePostFile(raw);
        renderPost(main, slug, data);
    } catch (err) {
        showError(main, '404', `Could not load post <code>${escapeHtml(filename)}</code>.`);
    }
}

loadPost();
