const express = require('express');
require('dotenv').config();

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

const G_USERNAME = process.env.G_USERNAME;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/post/:name', (req, res) => {
    res.sendFile(__dirname + '/public/post.html');
});


// API Routes

app.get('/api/posts', (req, res) => {
    fetch(`https://api.github.com/repos/${G_USERNAME}/blog/contents/posts`)
        .then(response => response.json())
        .then(data => {
            res.json(data);
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
            res.status(500).json({ error: 'Failed to fetch posts' });
        });
});
app.get('/api/posts/:name', (req, res) => {
    const { name } = req.params;

    fetch(`https://raw.githubusercontent.com/${G_USERNAME}/blog/main/posts/${name}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            res.send(data);
        })
        .catch(error => {
            console.error(`Error fetching post ${name}:`, error);
            res.status(500).json({ error: 'Failed to fetch post' });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});