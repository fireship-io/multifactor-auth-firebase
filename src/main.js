import firebase from 'firebase/app';
import 'firebase/auth';

firebase.initializeApp({
  // your config
});

const auth = firebase.auth();

// Listen to User's Auth State

auth.onAuthStateChanged((user) => {
  const userEl = document.getElementById('user');
  if (user) {
    userEl.innerHTML = `${user.email} logged in. ${JSON.stringify(
      user.multiFactor.enrolledFactors
    )}`;
  } else {
    userEl.innerHTML = 'signed out';
  }
});

// Setup a global captcha

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('2fa-captcha', {
  size: 'invisible',
  callback: function (response) {
    console.log('captcha solved!');
  },
});

// Step 1 - Sign Up and Verify Email
const signupBtn = document.getElementById('signup-button');

signupBtn.onclick = async () => {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const credential = await auth.createUserWithEmailAndPassword(email, password);
  await credential.user.sendEmailVerification();

  alert('check your email!');
};

// Step 2 - Enroll Second Factor

const enrollBtn = document.getElementById('enroll-button');

enrollBtn.onclick = async () => {
  const phoneNumber = document.getElementById('enroll-phone').value;

  const user = auth.currentUser;

  const session = await user.multiFactor.getSession();

  const phoneOpts = {
    phoneNumber,
    session,
  };

  const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();

  window.verificationId = await phoneAuthProvider.verifyPhoneNumber(
    phoneOpts,
    window.recaptchaVerifier
  );

  alert('sms text sent!');
};

const verifyEnrollmentBtn = document.getElementById('enroll-verify');

verifyEnrollmentBtn.onclick = async () => {
  const code = document.getElementById('enroll-code').value;

  const cred = new firebase.auth.PhoneAuthProvider.credential(
    window.verificationId,
    code
  );

  const multiFactorAssertion = firebase.auth.PhoneMultiFactorGenerator.assertion(
    cred
  );

  const user = auth.currentUser;
  await user.multiFactor.enroll(multiFactorAssertion, 'phone number');

  alert('enrolled in MFA');
};

// Step 3 - Sign
const signOutBtn = document.getElementById('signout');
signOutBtn.onclick = () => auth.signOut();

// Step 4 - Login with MFA
const loginBtn = document.getElementById('login-button');
loginBtn.onclick = async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    if (err.code === 'auth/multi-factor-auth-required') {
      // The user is enrolled in MFA, must be verified
      window.resolver = err.resolver;
    }
  }

  const phoneOpts = {
    multiFactorHint: window.resolver.hints[0],
    session: window.resolver.session,
  };

  const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();

  window.verificationId = await phoneAuthProvider.verifyPhoneNumber(
    phoneOpts,
    window.recaptchaVerifier
  );

  alert('sms text sent!');
};

const verifyLoginBtn = document.getElementById('login-verify');
verifyLoginBtn.onclick = async () => {
  const code = document.getElementById('login-code').value;

  const cred = new firebase.auth.PhoneAuthProvider.credential(
    window.verificationId,
    code
  );

  const multiFactorAssertion = firebase.auth.PhoneMultiFactorGenerator.assertion(
    cred
  );

  const credential = await window.resolver.resolveSignIn(multiFactorAssertion);

  console.log(credential);

  alert('logged in!');
};
