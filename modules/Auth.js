const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).send('Token inválido');
    }

}

module.exports = auth;