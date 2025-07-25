import axios from 'axios'

async function getToken() {
  try {
    const response = await axios.post(
      'http://localhost:5500/api/v1/auth/token',
      {
        grantType: 'password',
        username: 'admin@solo60.com',
        password: 'Admin123!',
      },
    )
    console.log('Token:', response.data.accessToken)
    return response.data.accessToken
  } catch (error) {
    console.error('Error:', error.response?.data || error.message)
  }
}

getToken()
