const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');


//express-validator: requires to express-validator/check are 
//deprecated.You should just use require("express-validator") instead.
const { check, validationResult } = require('express-validator');


const User = require('../../models/User');

//@route   GET api/auth
//@desc    Test route
//@access  Public
router.get('/', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//@route   POST api/auth
//@desc    Authenticate user and get token
//@access  Public

//allows api/<> to be used as /
router.post('/', 
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required')
            .exists()
    ],
    async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        //if any of the above do not match, we shoud a 400 error message 
        return res.status(400).json({ errors: errors.array() }); //400 is a bad request
    }

    const { email, password } = req.body;

    try {
        //see if user exists
        let user = await User.findOne({ email });

        if(!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }]  });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }]  });
        }

        //return JWT
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (error, token) => {
                if(error) throw error;
                res.json({ token });
            });

        //res.send('User Registered')
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }

});

module.exports = router;