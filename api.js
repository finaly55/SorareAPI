const axios = require('axios');

const apiUrl = 'https://api.sorare.com';
const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkN2NlMTMxZS0zOWUwLTRjMjMtYmRkNS03YzZiMmZhYzE0ZjIiLCJzY3AiOiJ1c2VyIiwiYXVkIjoiTWVvd0FVRCIsImlhdCI6MTY4OTMzNjM2NiwiZXhwIjoiMTY5MTkyODM2NiIsImp0aSI6Ijc2OWY2MzU1LTIzNmUtNDU0OC04MzA0LTU4OTQyY2IwMDYwOCJ9.PAzvwrKkCJiSIh-pj7lSN9z03cIDiHAMt3A5OkBmjy8'; // Remplacez par votre véritable Bearer Token

async function postRequest(path, requestBody) {
  try {
    const response = await axios.post(apiUrl + path, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'JWT-AUD': "MeowAUD"
      }
    });
    return response.data;
  } catch (error) {
    return "erreur";
  }
}

module.exports = {
  postRequest
};