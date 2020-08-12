const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config')

//express-validator: requires to express-validator/check are 
//deprecated.You should just use require("express-validator") instead.
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

//@route   POST api/users
//@desc    Register User
//@access  Public

//allows api/<> to be used as /
router.post('/', 
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters')
            .isLength({min: 6 })
    ],
    async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        //if any of the above do not match, we shoud a 400 error message 
        return res.status(400).json({ errors: errors.array() }); //400 is a bad request
    }

    const { name, email, password } = req.body;

    try {
        //see if user exists
        let user = await User.findOne({ email });

        if(user) {
            return res.status(400).json({ errors: [{ msg: 'User already Exists' }]  });
        }

        //get users' gravatar
        const avatar = gravatar.url(email, { 
            s: '200', 
            r: 'pg', 
            d: 'mm' 
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });

        //Encrypt password using bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        //anything that returns a promise should use await
        await user.save();

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