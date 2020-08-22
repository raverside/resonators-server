import express from '../express';
import routeHandler from '../routeHandler';
<<<<<<< HEAD
import {getResonatorStats, sendResonatorAnswer} from '../../application/resonatorStats';
=======
import { getResonatorStats, sendResonatorAnswer, convertStatsToCSV } from '../../application/resonatorStats';
import renderClient from '../renderClient';
>>>>>>> master


express.get('/api/criteria/stats/reminders/:resonatorId\.:ext?', routeHandler(async (request, response) => {
    const { resonatorId } = request.params;
    const stats = await getResonatorStats(resonatorId);
    response.status(stats ? 200 : 422).send(stats);
}, {
    enforceLeaderResonator: true
}));

express.get('/api/criteria/stats/reminders/:resonatorId/download\.:ext?', routeHandler(async (request, response) => {
    const { resonatorId } = request.params;
    const stats = await getResonatorStats(resonatorId);
    if (stats) {
        response.status(200);
        response.setHeader('Content-Type', 'text/csv');
        response.setHeader('Content-Disposition', `attachment; filename="resonatorStats-${(new Date()).toLocaleString("en-US")}.csv"`);
        convertStatsToCSV(stats).pipe(response);
    } else {
        response.sendStatus(422);
    }
}, {
    enforceLeaderResonator: true
}));

express.post(`/api/criteria/stats/reminders/:resonator_id/criteria/submit`, routeHandler(async (request, response) => {
    const { resonator_id } = request.params;
    const { question_id, answer_id, sent_resonator_id } = request.body;

    const result = await sendAnswer({ resonator_id, question_id, answer_id, sent_resonator_id });

    if (result)
        response.status(200).json(result);
    else 
        response.status(422).send('Answer submission failed.');
}, {
    enforceLogin: false
}));

async function sendAnswer({ resonator_id, question_id, answer_id, sent_resonator_id, response }) {
    if (!question_id || !answer_id || !sent_resonator_id) {
        response.status(400);
        return response.json({});
    }

    return await sendResonatorAnswer({
        resonator_id,
        question_id,
        answer_id,
        sent_resonator_id
    });
}
