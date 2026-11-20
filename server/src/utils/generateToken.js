// Owner: M1
import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_me')
    {
        throw new Error('Set JWT_SECRET to a private value before starting the API');
    }
    const token = jwt.sign({
        id: userId.toString()
    }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
    return token;
};

export default generateToken;
