import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ ok: false, message: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ ok: false, message: "Unauthorized" });
        req.user = decoded;
        next();
    });
};