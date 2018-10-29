# battle-api

The API is hosted on heroku at https://desolate-brook-68153.herokuapp.com/  
API has the following endpoints:

- api/battle/
- api/battle/list
- api/battle/count
- api/battle/stats
- api/battle/list/search

Same endpoints, with jwt authentication
- api/battle_auth/
- api/battle_auth/list
- api/battle_auth/count
- api/battle_auth/stats
- api/battle_auth/search

Additional stuff which can be done:
- Have the database login credentials, and the auth secret in the heroku environment variables, or a similar location outside of the code

In order to use the auth endpoints, one needs to use the register/login endpoints and pass the jwt (x-access-token header) with the requests, here's how it can be done:

1. POST api/auth/register  
  Request body to be x-www-form-urlencoded  

  name: Some Name  
  email: something@domain.com  
  password: <password>  

  Successful response will contain the following data  
  auth: boolean  
  token: <token>  

2. For an existing user, the below endpoint is to be used to log in:  
  POST api/auth/login  
  Request body to be x-www-form-urlencoded  

  email: <registered email id>  
  password: <password>  

  Successful response will contain the following data  
  auth: boolean  
  token: <token>  


3. Call the endpoint with the jwt, like so:  
 GET https://desolate-brook-68153.herokuapp.com/api/battle_auth/stats  

 Request headers:  
 x-access-token: <token>  