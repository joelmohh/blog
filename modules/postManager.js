// https://api.github.com/repos/SEU_USUARIO/SEU_REPO/contents/caminho/arquivo.txt
const G_USERNAME = process.env.G_USERNAME;
const REPO_NAME = process.env.G_REPONAME;

function getFileSha(name){
    fetch(`https://api.github.com/repos/${G_USERNAME}/${REPO_NAME}/contents/posts/${name}.md`, {
        headers: {
            'Authorization': `token ${process.env.G_TOKEN}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error(`Error fetching post ${name}:`, error);
        throw new Error('Failed to fetch post');
    });
}

async function newPost(content, name){
    const response = await fetch(`https://api.github.com/repos/${G_USERNAME}/${REPO_NAME}/contents/posts/${name}.md`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${process.env.G_TOKEN}`
        },
        body: JSON.stringify({
            message: `New post \n ${new Date().toLocaleDateString()} - ${name}`,
            content: btoa(content)
        })
    })
    if(response.ok){
        return await response.json();
    } else {
        throw new Error('Failed to create post');
    }
}

async function updatePost(content, name){
    // get file sha
    const sha = getFileSha(name);
    return sha.json().then(data => {
        return fetch(`https://api.github.com/repos/${G_USERNAME}/${REPO_NAME}/contents/posts/${name}.md`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${process.env.G_TOKEN}`
            },
            body: JSON.stringify({
                message: `Update post \n ${new Date().toLocaleDateString()} - ${name}`,
                content: btoa(content),
                sha: data.sha
            })
        }).then(response => {
            if(response.ok){
                return response.json();
            } else {
                throw new Error('Failed to update post');
            }
        })
    })
}

async function deletePost(name){
    const sha = getFileSha(name);
    return sha.json().then(data => {
        return fetch(`https://api.github.com/repos/${G_USERNAME}/${REPO_NAME}/contents/posts/${name}.md`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${process.env.G_TOKEN}`
            },
            body: JSON.stringify({
                message: `Delete post \n ${new Date().toLocaleDateString()} - ${name}`,
                sha: data.sha
            })
        }).then(response => {
            if(response.ok){
                return response.json();
            } else {
                throw new Error('Failed to delete post');
            }
        })
    })
}

module.exports = {
    newPost,
    updatePost,
    deletePost
}