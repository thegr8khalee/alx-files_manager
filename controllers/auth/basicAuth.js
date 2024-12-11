class BasicAuth {
  static currentUser(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return null; // No authorization header
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'ascii'
    );
    const [email, password] = credentials.split(':');

    return { email, password }; // Return user credentials (replace with actual user lookup logic)
  }
}

export default BasicAuth;
