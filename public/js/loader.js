const POSTS_PER_PAGE = 5;
let allPosts = [];
let currentPage = 1;

async function getUpdatedPosts() {
    try {
        const response = await fetch('https://api.github.com/repos/joelmohh/blog/contents/posts');
        const posts = await response.json();

        return posts.sort((a, b) => nameToDate(b.name) - nameToDate(a.name));
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

function nameToDate(name) {
    const day = parseInt(name.substring(0, 2), 10);
    const monthStr = name.substring(2, 5);
    const year = parseInt(name.substring(5, 9), 10);
    const hour = parseInt(name.substring(9, 11), 10);
    const min = parseInt(name.substring(11, 13), 10);

    const months = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3,
        MAY: 4, JUN: 5, JUL: 6, AUG: 7,
        SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    return new Date(year, months[monthStr] ?? 0, day, hour, min);
}

function nameToData(name) {
    // Expected format: "DDMMMYYYYTTTT.md"
    const day = name.substring(0, 2);
    const month = name.substring(2, 5);
    const year = name.substring(5, 9);
    const time = name.substring(9, 13);

    const timeFormatted = `${time.substring(0, 2)}:${time.substring(2, 4)}`;

    const months = {
        JAN: "January", FEB: "February", MAR: "March",    APR: "April",
        MAY: "May",     JUN: "June",     JUL: "July",     AUG: "August",
        SEP: "September", OCT: "October", NOV: "November", DEC: "December"
    };

    return {
        month: months[month] || month,
        day,
        year,
        time: timeFormatted
    };
}

async function getPostData(name) {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/joelmohh/blog/main/posts/${name}`);
        const postData = await response.text();

        const [metaPart, contentPart = ""] = postData.split("CONTENT:");
        const lines = metaPart.split("\n");

        const data = {};

        lines.forEach(line => {
            const [key, ...rest] = line.split(":");
            if (!key || !rest.length) return;
            data[key.trim()] = rest.join(":").trim();
        });

        data.CONTENT = contentPart.trim();

        return data;
    } catch (error) {
        console.error('Error fetching post data:', error);
        return null;
    }
}

async function renderPage(page) {
    const postContainer = document.querySelector('.post-grid');
    const paginationContainer = document.querySelector('.pagination');
    if (!postContainer) return;

    postContainer.innerHTML = '<p class="loading">Loading posts…</p>';

    const gridPosts = allPosts.slice(1);
    const totalPages = Math.ceil(gridPosts.length / POSTS_PER_PAGE);
    const start = (page - 1) * POSTS_PER_PAGE;
    const pagePosts = gridPosts.slice(start, start + POSTS_PER_PAGE);

    let html = '';
    for (const post of pagePosts) {
        const data = await getPostData(post.name);
        if (!data) continue;
        const time = nameToData(post.name);
        html += `
        <article class="post-card">
            <p class="post-date">Published on ${time.month} ${time.day}, ${time.year} at ${time.time}</p>
            <figure class="post-thumb">
                <img src="${data.IMAGE_URL || ''}" alt="Cover image for the post" width="1200" height="680" loading="lazy">
            </figure>
            <h3>${data.TITLE || ''}</h3>
            <p>${data.DESCRIPTION || ''}</p>
            <a href="${post.html_url}" target="_blank">Read more</a>
        </article>`;
    }

    postContainer.innerHTML = html || '<p>No posts available.</p>';

    // Pagination only appear if there are more posts than the per-page limit
    if (gridPosts.length > POSTS_PER_PAGE) {
        renderPagination(page, totalPages, paginationContainer);
    }
}

function renderPagination(current, total, container) {
    if (!container) return;

    let html = '';

    html += `<button class="page-btn" data-page="${current - 1}" ${current === 1 ? 'disabled' : ''} aria-label="Previous page">&#8592;</button>`;

    for (let i = 1; i <= total; i++) {
        if (
            i === 1 ||
            i === total ||
            (i >= current - 1 && i <= current + 1)
        ) {
            html += `<button class="page-btn ${i === current ? 'active' : ''}" ${i === current ? 'disabled' : ''} data-page="${i}" aria-label="Page ${i}" aria-current="${i === current ? 'page' : 'false'}">${i}</button>`;    
        } else if (i === current - 2 || i === current + 2) {
            html += `<span class="page-ellipsis">…</span>`;
        }
    }

    html += `<button class="page-btn" data-page="${current + 1}" ${current === total ? 'disabled' : ''} aria-label="Next page">&#8594;</button>`;

    container.innerHTML = html;

    container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderPage(currentPage);
            document.querySelector('#posts').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

async function renderPosts() {
    const postContainer = document.querySelector('.post-grid');
    const latestPostContainer = document.querySelector('.hero');
    if (!postContainer) return;

    postContainer.innerHTML = '<p class="loading">Loading posts…</p>';

    allPosts = await getUpdatedPosts();

    if (!allPosts.length) {
        postContainer.innerHTML = '<p>No posts available.</p>';
        return;
    }

    if (latestPostContainer && allPosts[0]) {
        const data = await getPostData(allPosts[0].name);
        const time = nameToData(allPosts[0].name);
        if (data) {
            latestPostContainer.innerHTML = `
                <div class="container hero-content">
                    <p class="eyebrow">Latest post</p>
                    <h1>${data.TITLE || ''}</h1>
                    <p class="hero-text">${data.DESCRIPTION || ''}</p>
                    <figure class="hero-visual">
                        <img src="${data.IMAGE_URL || './images/hero-visual.svg'}" alt="${data.TITLE || 'Featured post'}" width="1200" height="680" decoding="async">
                    </figure>
                    <div class="hero-meta">
                        <time datetime="${time.year}-${time.month}-${time.day}">${time.month} ${time.day}, ${time.year}</time>
                        <a href="#" class="button">Read article</a>
                    </div>
                </div>`;
        }
    }

    await renderPage(1);
}

renderPosts();