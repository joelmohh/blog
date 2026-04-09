/*
<div class="post-list">
                <a class="post-row" href="/admin/edit-post/${name}">
                    <span class="post-row-title">Title <br><span class="post-row-meta">Description</span></span>
                    <span class="post-row-meta">Creation date</span>
                </a>
            </div>
*/
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
        const response = await fetch(`/api/posts/${name}`);
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


async function loadAdminPosts() {
    const postList = document.querySelector('.post-list');
    if (!postList) return;

    postList.innerHTML = '<p class="loading">Loading posts…</p>';

    const posts = await fetch('/api/posts')
        .then(res => res.json())
        .catch(err => {
            console.error('Error fetching posts:', err);
            return [];
        });

    if (!posts.length) {
        postList.innerHTML = '<p>No posts available.</p>';
        return;
    }

    const html = (await Promise.all(posts.map(async post => {
        const data = await getPostData(post.name);
        const time = nameToData(post.name);
        return `
            <a class="post-row" href="/admin/edit-post/${post.name.replace('.md', '')}">
                <span class="post-row-title">${data.TITLE || 'Untitled'}<br><span class="post-row-meta">${data.DESCRIPTION || ''}</span></span>
                <span class="post-row-meta">${time.month} ${time.day}, ${time.year}</span>
            </a>`;
    }))).join('');

    postList.innerHTML = html;
}
loadAdminPosts();