        function nameToData(name) {
            const day = name.substring(0, 2);
            const month = name.substring(2, 5);
            const year = name.substring(5, 9);
            const time = name.substring(9, 13);
            const timeFormatted = `${time.substring(0, 2)}:${time.substring(2, 4)}`;
            const months = {
                JAN: "January", FEB: "February", MAR: "March", APR: "April",
                MAY: "May", JUN: "June", JUL: "July", AUG: "August",
                SEP: "September", OCT: "October", NOV: "November", DEC: "December"
            };
            return { month: months[month] || month, day, year, time: timeFormatted };
        }

        function parseMarkdown(md) {
            const lines = md.split('\n');
            const out = [];
            let inUl = false;
            let inOl = false;
            let inPre = false;
            let preBuffer = [];

            const inline = str => str
                .replace(/```([^`]+)```/g, (_, c) => `<code>${escapeHtml(c)}</code>`)
                .replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`)
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

            const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false; } };
            const closeOl = () => { if (inOl) { out.push('</ol>'); inOl = false; } };

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Code block
                if (line.startsWith('```')) {
                    if (!inPre) {
                        inPre = true;
                        preBuffer = [];
                    } else {
                        out.push(`<pre><code>${escapeHtml(preBuffer.join('\n'))}</code></pre>`);
                        inPre = false;
                        preBuffer = [];
                    }
                    continue;
                }

                if (inPre) {
                    preBuffer.push(line);
                    continue;
                }

                if (/^- (.+)/.test(line)) {
                    closeOl();
                    if (!inUl) { out.push('<ul>'); inUl = true; }
                    out.push(`<li>${inline(line.replace(/^- /, ''))}</li>`);
                    continue;
                }

                if (/^\d+\. (.+)/.test(line)) {
                    closeUl();
                    if (!inOl) { out.push('<ol>'); inOl = true; }
                    out.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`);
                    continue;
                }

                closeUl();
                closeOl();

                if (/^## (.+)/.test(line)) {
                    out.push(`<h2>${inline(line.replace(/^## /, ''))}</h2>`);
                } else if (/^### (.+)/.test(line)) {
                    out.push(`<h3>${inline(line.replace(/^### /, ''))}</h3>`);
                } else if (/^> (.+)/.test(line)) {
                    out.push(`<blockquote><p>${inline(line.replace(/^> /, ''))}</p></blockquote>`);
                } else if (line.trim() === '---') {
                    out.push('<hr>');
                } else if (line.trim() === '') {
                    out.push('');
                } else {
                    out.push(`<p>${inline(line)}</p>`);
                }
            }

            closeUl();
            closeOl();

            return out.join('\n');
        }
        
        function escapeHtml(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        async function loadPost() {
            const main = document.getElementById('post-main');
            const params = new URLSearchParams(window.location.search);
            const slug = params.get('post'); // ex: ?post=28MAR20261430

            if (!slug) {
                showError(main, 'Post not found', 'No post specified in the URL.');
                return;
            }

            const filename = slug.endsWith('.md') ? slug : `${slug}.md`;

            try {
                const res = await fetch(`https://raw.githubusercontent.com/joelmohh/blog/main/posts/${filename}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const raw = await res.text();
                const [metaPart, contentPart = ''] = raw.split('CONTENT:');
                const data = {};

                metaPart.split('\n').forEach(line => {
                    const [key, ...rest] = line.split(':');
                    if (!key || !rest.length) return;
                    data[key.trim()] = rest.join(':').trim();
                });

                data.CONTENT = contentPart.trim();

                const time = nameToData(slug);
                const datetime = `${time.year}-${String(time.day).padStart(2, '0')}-${time.month}`;

                document.title = `${data.TITLE || slug} — Joelmo's Blog`;
                if (data.DESCRIPTION) {
                    document.querySelector('meta[name="description"]').setAttribute('content', data.DESCRIPTION);
                }

                main.innerHTML = `
                    <section class="post-hero">
                        <div class="container">
                            <a class="back-link" href="./index.html">All posts</a>
                            <div class="post-meta-row">
                                <p class="eyebrow" style="margin:0">${data.CATEGORY || 'Post'}</p>
                                <span class="dot">·</span>
                                <time datetime="${datetime}">${time.month} ${time.day}, ${time.year} at ${time.time}</time>
                            </div>
                            <h1 class="post-title">${data.TITLE || slug}</h1>
                            ${data.DESCRIPTION ? `<p class="post-description">${data.DESCRIPTION}</p>` : ''}
                            ${data.IMAGE_URL ? `
                            <figure class="post-cover">
                                <img src="${data.IMAGE_URL}" alt="${data.TITLE || 'Post cover'}" width="1200" height="525" decoding="async">
                            </figure>` : ''}
                        </div>
                    </section>

                    <section class="post-body">
                        <div class="container">
                            <div class="post-content">
                                ${data.CONTENT ? parseMarkdown(data.CONTENT) : '<p><em>No content available.</em></p>'}
                            </div>
                        </div>
                    </section>
                `;
            } catch (err) {
                showError(main, '404', `Could not load post <code>${filename}</code>.`);
            }
        }

        function showError(container, title, message) {
            container.innerHTML = `
                <div class="post-error container">
                    <strong>${title}</strong>
                    <p>${message}</p>
                    <a class="back-link" href="./index.html" style="margin-top:16px;display:inline-flex">Back to home</a>
                </div>
            `;
        }

        loadPost();