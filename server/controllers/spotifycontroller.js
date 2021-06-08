import {genSalt} from 'bcrypt';
require('dotenv').config();
export default spotifyController = {

  stateArr: [],

  async startAuth(req,res,next) {

    try {
      const state = await genSalt(1);
      
      state += this.stateArr.length;
      
      this.stateArr.push(state);

      const spotifyData = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT,
        response_type: 'code',
        state: state,
        redirect_uri: process.env.SPOTIFY_REDIRECT,
        scope: 'playlist-read-private user-library-read'
      })
    }
    catch (e) {
      console.log(e);
      return;
    }
    finally {
      res.redirect('https://accounts.spotify.com/authorize?' + spotifyData);
      return;
    }
  },

  async confirmAuth(req,res,next) {

    try {

      if(req.query.error) throw req.query.error;

      const state = req.query.state;

      const index = +state[state.length - 1];

      if(this.stateArr[index] !== state) throw 'Invalid state token';

      const fetchBody = {
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: process.env.SPOTIFY_REDIRECT,
      }

      const spotifyAuth = btoa(`${process.env.SPOTIFY_CLIENT}:${process.env.SPOTIFY_SECRET}`);

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Authorization' : 'Basic ' + spotifyAuth
        },
        body: JSON.stringify(fetchBody)
      }).json();

      res.locals.accessToken = response.body.access_token;
      res.locals.refreshToken = response.body.refresh_token;
    }
    
    catch (e) {

      console.log(e);
      
      return;
    }
    
    finally {
      return next();
    }
  },

  async refreshToken(req,res,next) {

    try {

      const fetchBody = {
        grant_type: 'refresh_token',
        refresh_token: req.refreshToken,
        client_id: process.env.SPOTIFY_CLIENT,
        client_secret: process.env.SPOTIFY_SECRET
      }

      const spotifyAuth = btoa(`${process.env.SPOTIFY_CLIENT}:${process.env.SPOTIFY_SECRET}`);

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Authorization' : 'Basic ' + spotifyAuth
        },
        body: JSON.stringify(fetchBody)
      }).json();

    }

    catch (e) {

      console.log(e);

      return;
    }

    finally {

      res.locals.accessToken = response.body.access_token;

      return next();
    }
  }
}