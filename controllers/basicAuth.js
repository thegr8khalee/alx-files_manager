class BasicAuth {
    static currentUser(req) {
      const authHeader = req.headers.authorization;
      
      // Debugging: log the full authorization header
      console.log('Authorization Header:', authHeader);
  
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return null; // No authorization header
      }
  
      const base64Credentials = authHeader.split(' ')[1];
      console.log('Base64 Credentials:', base64Credentials); // Debugging: log the base64 string
  
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      console.log('Decoded Credentials:', credentials); // Debugging: log the decoded credentials
  
      const [email, password] = credentials.split(':');
      console.log('Email:', email, 'Password:', password); // Debugging: log email and password
  
      return { email, password }; // Return user credentials (replace with actual user lookup logic)
    }
  }
  
  export default BasicAuth;
  