// backend/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    console.log('ENTER register()', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const hash = await bcrypt.hash(String(password), 12);

    // NOTE: isSuperAdmin / isAdmin will take defaults from schema
    const doc = await User.create({
      email: String(email),
      password: hash,
    });

    return res.status(201).json({
      user: {
        id: doc._id,
        email: doc.email,
        isSuperAdmin: doc.isSuperAdmin, // NEW
        isAdmin: doc.isAdmin,           // NEW
        adminOf: doc.adminOf,
      },
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    console.log('LOGIN body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('LOGIN fail: no user');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      console.log('LOGIN fail: wrong password');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    console.log('LOGIN success for', email);

    // CHANGED: unified secret + role fields in payload
    const secret = (process.env.JWT_SECRET || 'devsecret').trim(); // CHANGED
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin, // NEW
        isAdmin: user.isAdmin,           // NEW (regular club admin)
        adminOf: user.adminOf,
      },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin, // NEW
        isAdmin: user.isAdmin,           // NEW
        adminOf: user.adminOf,
      },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return next(err);
  }
};

// for JWT-based "me"
exports.me = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const token = auth.split(' ')[1];

    // CHANGED: same secret
    const secret = (process.env.JWT_SECRET || 'devsecret').trim(); // CHANGED
    const payload = jwt.verify(token, secret);                      // CHANGED

    const user = await User.findById(payload.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};


   
  //const passwordHash = await bcrypt.hash(password, 12);
    /*
    const user = await User.create({ first, last, email, passwordHash });*/
   /*onsole.log('hashed password ok');
    const user = await User.create({
        email,
        password: hash,
    });


    return res.status(201).json({
      user: { id: user._id, first: user.first, last: user.last, email: user.email }
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

    // const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      user: { id: user._id, first: user.first, last: user.last, email: user.email }
      // , token
    });
  } catch (err) {
    return next(err);
  }
};*/



/*
exports.login = async (req, res) => { // user data exists
};

exports.register = async (req, res) => { // user data doesnt, login button pressed etc
};

// just what i had in mind, feel free to change it

// while there should be a "admin feature" , we can just do it manually thourgh postgres to get it working :)*/