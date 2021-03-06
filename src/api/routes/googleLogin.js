import express from '../express';
import routeHandler from '../routeHandler';
import {getLoginUrl, loginGoogleUser} from '../../application/google/googleLogin';
import setLoginCookie from './setLoginCookie';

express.get('/api/startGoogleLogin', routeHandler(async (request, response) => {
    const url = await getLoginUrl();

    response.status(200);

    response.json({
        url
    });
}, {
    enforceLogin: false
}));

express.get('/api/completeGoogleLogin', routeHandler(async (request, response) => {
    const {code} = request.query;

    const result = await loginGoogleUser(code);

    setLoginCookie({response, loginId: result.loginId});

    // Redirecting to login lets the client figure the proper route itself based on user type
    response.redirect(301, '/login');
}, {
    enforceLogin: false
}));
