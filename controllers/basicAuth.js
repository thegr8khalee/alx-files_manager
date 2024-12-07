const { Buffer } = require('buffer'); // To handle base64 decoding
const User = require('./models/user'); // Adjust the path to your user model

class BasicAuth {
  /**
   * Extracts the Base64 part of the Authorization header for Basic Authentication.
   * @param {string} authorizationHeader
   * @returns {string|null} The Base64 token or null if invalid.
   */
  extractBase64AuthorizationHeader(authorizationHeader) {
    if (typeof authorizationHeader === 'string') {
      const pattern = /^Basic (?<token>.+)$/;
      const match = authorizationHeader.trim().match(pattern);
      if (match) {
        return match.groups.token;
      }
    }
    return null;
  }

  /**
   * Decodes the Base64 authorization header.
   * @param {string} base64AuthorizationHeader
   * @returns {string|null} The decoded string or null if invalid.
   */
  decodeBase64AuthorizationHeader(base64AuthorizationHeader) {
    if (typeof base64AuthorizationHeader === 'string') {
      try {
        const buffer = Buffer.from(base64AuthorizationHeader, 'base64');
        return buffer.toString('utf-8');
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  /**
   * Extracts user credentials (email and password) from the decoded Base64 authorization header.
   * @param {string} decodedBase64AuthorizationHeader
   * @returns {Array<string, string>|null} An array with user email and password, or null if invalid.
   */
  extractUserCredentials(decodedBase64AuthorizationHeader) {
    if (typeof decodedBase64AuthorizationHeader === 'string') {
      const pattern = /^(?<user>[^:]+):(?<password>.+)$/;
      const match = decodedBase64AuthorizationHeader.trim().match(pattern);
      if (match) {
        return [match.groups.user, match.groups.password];
      }
    }
    return null;
  }

  /**
   * Retrieves a user based on their credentials.
   * @param {string} userEmail
   * @param {string} userPwd
   * @returns {Object|null} The user object or null if not found.
   */
  async userObjectFromCredentials(userEmail, userPwd) {
    if (typeof userEmail === 'string' && typeof userPwd === 'string') {
      try {
        const users = await User.find({ email: userEmail });
        if (users.length > 0) {
          const user = users[0];
          if (await user.isValidPassword(userPwd)) {
            return user;
          }
        }
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  /**
   * Retrieves the current user from the request using Basic Authentication.
   * @param {object} request
   * @returns {Object|null} The user object or null if not found.
   */
  async currentUser(request) {
    const authHeader = this.authorizationHeader(request);
    const b64AuthToken = this.extractBase64AuthorizationHeader(authHeader);
    const authToken = this.decodeBase64AuthorizationHeader(b64AuthToken);
    const [email, password] = this.extractUserCredentials(authToken);
    return await this.userObjectFromCredentials(email, password);
  }

  /**
   * Retrieves the Authorization header from the request.
   * @param {object} request
   * @returns {string|null} The Authorization header or null if not found.
   */
  authorizationHeader(request) {
    if (request && request.headers && request.headers.authorization) {
      return request.headers.authorization;
    }
    return null;
  }
}

module.exports = BasicAuth;
