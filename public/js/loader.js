async function getUpdatedPosts() {
    try {
        const response = await fetch('https://api.github.com/repos/joelmohh/blog/contents/posts');
        const posts = await response.json();

        return posts.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } catch (error) {
        console.error('Erro ao buscar posts:', error);
        return [];
    }
}

function nameToData(name) {
    // expecting format: "DDMMMYYYYTTTT.md"
    const day = name.substring(0, 2);
    const month = name.substring(2, 5);
    const year = name.substring(5, 9);
    const time = name.substring(9, 13);

    const timeFormatted = `${time.substring(0, 2)}:${time.substring(2, 4)}`;

    const months = {
        "JAN": "January",
        "FEB": "February",
        "MAR": "March",
        "APR": "April",
        "MAY": "May",
        "JUN": "June",
        "JUL": "July",
        "AUG": "August",
        "SEP": "September",
        "OCT": "October",
        "NOV": "November",
        "DEC": "December"
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
        console.error('Erro ao buscar post:', error);
        return null;
    }
}

async function renderPosts() {
    const posts = await getUpdatedPosts();

    if(!posts.length) {
        const postContainer = document.querySelector('.post-grid');
        if (postContainer) {
            postContainer.innerHTML = '<p>No posts available.</p>';
        }
        return;
    }

    const postContainer = document.querySelector('.post-grid');

    if (!postContainer) return;

    let html = '';

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const isLatest = i === 0;

        if (isLatest) continue;

        const data = await getPostData(post.name);
        let time = nameToData(post.name);
        if (!data) continue;

        html += `
        <article class="post-card">
            <p class="post-date">Published on ${time.month} ${time.day}, ${time.year} at ${time.time}</p>
            <figure class="post-thumb">
                <img src="${data.IMAGE_URL || ''}" alt="Cover image for the post" width="1200" height="680" loading="lazy">
            </figure>
            <h3>${data.TITLE || ''}</h3>
            <p>${data.DESCRIPTION || ''}</p>
            <a href="${post.html_url}" target="_blank">Read more</a>
        </article>
        `;
    }

    postContainer.innerHTML = html;
}

renderPosts();