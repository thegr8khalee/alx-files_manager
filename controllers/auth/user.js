const crypto = require('crypto');
const Base = require('./base'); // Assuming there is a base class

class User extends Base {
  constructor(...args) {
    super(...args);
    this.email = args[0] && args[0].email;
    this._password = args[0] && args[0]._password;
    this.firstName = args[0] && args[0].firstName;
    this.lastName = args[0] && args[0].lastName;
  }

  // Getter for password
  get password() {
    return this._password;
  }

  // Setter for password, encrypts it using SHA256
  set password(pwd) {
    if (pwd === null || typeof pwd !== 'string') {
      this._password = null;
    } else {
      this._password = crypto
        .createHash('sha256')
        .update(pwd)
        .digest('hex')
        .toLowerCase();
    }
  }

  // Validate the password
  isValidPassword(pwd) {
    if (pwd === null || typeof pwd !== 'string') {
      return false;
    }
    if (this.password === null) {
      return false;
    }
    const pwdE = Buffer.from(pwd);
    return (
      crypto.createHash('sha256').update(pwdE).digest('hex').toLowerCase() ===
      this.password
    );
  }

  // Display the user's name
  displayName() {
    if (!this.email && !this.firstName && !this.lastName) {
      return '';
    }
    if (!this.firstName && !this.lastName) {
      return this.email;
    }
    if (!this.lastName) {
      return this.firstName;
    }
    if (!this.firstName) {
      return this.lastName;
    } else {
      return `${this.firstName} ${this.lastName}`;
    }
  }
}

module.exports = User;
