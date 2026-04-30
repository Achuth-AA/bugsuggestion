const express = require('express');
const router  = express.Router();
const Joi     = require('joi');
const { v4: uuidv4 } = require('uuid');
const {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { cognitoClient } = require('../config/aws');
const { pool }          = require('../config/db');

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role:     Joi.string().valid('driver', 'rider').required(),
  phone:    Joi.string().max(20).optional(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, role, phone } = value;

    const signUpCmd = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email',        Value: email },
        { Name: 'name',         Value: name },
        { Name: 'custom:role',  Value: role },
      ],
    });

    const cognitoRes = await cognitoClient.send(signUpCmd);
    const userId     = uuidv4();

    await pool.query(
      'INSERT INTO users (user_id, name, email, role, cognito_sub, phone) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name, email, role, cognitoRes.UserSub, phone || null]
    );

    res.status(201).json({
      message:   'Registration successful. Check your email to verify your account.',
      userId,
      userConfirmed: cognitoRes.UserConfirmed,
    });
  } catch (err) {
    if (err.name === 'UsernameExistsException') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
});

// POST /auth/confirm
router.post('/confirm', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    await cognitoClient.send(new ConfirmSignUpCommand({
      ClientId:         CLIENT_ID,
      Username:         email,
      ConfirmationCode: code,
    }));

    res.json({ message: 'Account confirmed. You can now log in.' });
  } catch (err) {
    if (err.name === 'CodeMismatchException') {
      return res.status(400).json({ error: 'Invalid confirmation code' });
    }
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;

    const authCmd = new InitiateAuthCommand({
      AuthFlow:       'USER_PASSWORD_AUTH',
      ClientId:       CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });

    const authRes = await cognitoClient.send(authCmd);
    const tokens  = authRes.AuthenticationResult;

    const { rows } = await pool.query(
      'SELECT user_id, name, email, role, profile_photo_url FROM users WHERE email = $1',
      [email]
    );

    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    res.json({
      message:      'Login successful',
      accessToken:  tokens.AccessToken,
      idToken:      tokens.IdToken,
      refreshToken: tokens.RefreshToken,
      expiresIn:    tokens.ExpiresIn,
      user:         rows[0],
    });
  } catch (err) {
    if (err.name === 'NotAuthorizedException' || err.name === 'UserNotFoundException') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(err);
  }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    await cognitoClient.send(new ForgotPasswordCommand({ ClientId: CLIENT_ID, Username: email }));
    res.json({ message: 'Password reset code sent to your email' });
  } catch (err) {
    next(err);
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    await cognitoClient.send(new ConfirmForgotPasswordCommand({
      ClientId:         CLIENT_ID,
      Username:         email,
      ConfirmationCode: code,
      Password:         newPassword,
    }));

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
