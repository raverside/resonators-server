import {generateAuthUrl, requestAccessToken} from '../../google/oauth';
import googleAccountsRepository from '../../db/repositories/GoogleAccountRepository';
import addGoogleAccount from './addGoogleAccount';
import getUow from '../getUow';

export async function startGoogleAuth(userId, action) {
    const hasGoogleAccount = !!await googleAccountsRepository.findByUserId(userId);

    let url = generateAuthUrl({userId, action});

    if (!hasGoogleAccount)
        url += '&prompt=consent';

    return url;
}

export async function endGoogleAuth(user_id, action, gooleAuthCode) {
    const tokens = await requestAccessToken(gooleAuthCode);

    const {
        access_token,
        id_token,
        refresh_token,
        expiry_date //timestamp
    } = tokens;

    let googleAccount = await googleAccountsRepository.findByUserId(user_id);

    const uow = getUow();

    if (!googleAccount) {
        await addGoogleAccount({
            user_id,
            access_token,
            id_token,
            refresh_token,
            expiry_date //timestamp
        });
    } else {
        googleAccount.id_token = id_token;
        googleAccount.access_token = access_token;
        googleAccount.refresh_token = refresh_token;
        googleAccount.expiry_date = expiry_date;
    }

    await uow.commit();
}
