import _ from 'lodash';
import setLoginCookie from './setLoginCookie';
import generateFixtures from '../dbFixtures/fixtureGenerator';
import {assert} from 'chai';
import request from '../api/supertestWrapper';

describe('leader_clinics', () => {
    it('get clinics', async () => {
        const { user, userLogin, clinic } = await generateFixtures().preset1();

        const response = await request({
            method: 'get',
            url: '/api/leader_clinics',
            cookie: `loginId=${userLogin.id}`
        });

        assert.shallowDeepEqual(response.body, [{
            id: clinic.id,
            user_id: user.id,
            name: clinic.name
        }]);

        assert.isOk(response.body[0].createdAt);
        assert.isOk(response.body[0].updatedAt);
    });

    it('get clinic criteria', async () => {
        const {userLogin, clinics, questions} = await generateFixtures().presetLeaderWithManyClinics();

        const response = await request({
            method: 'get',
            url: `/api/leader_clinics/${clinics[0].id}/criteria`,
            cookie: `loginId=${userLogin.id}`
        });

        assert.equal(response.status, 200);

        const question = questions[0];
        const actualQuestions = response.body.map(q => _.omit(q, 'createdAt', 'updatedAt'));

        assert.deepEqual(actualQuestions, [{
            ...question,
            answers: question.answers.map(a => _.omit(a, 'question_id'))
        }]);

        assert.isOk(response.body[0].createdAt);
        assert.isOk(response.body[0].updatedAt);
    });

    it('get all leader criteria', async () => {
        const {userLogin, clinics, questions} = await generateFixtures().presetLeaderWithManyClinics();

        const response = await request({
            method: 'get',
            url: `/api/leader_clinics/all/criteria`,
            cookie: `loginId=${userLogin.id}`
        });

        assert.equal(response.status, 200);

        assertQuestions(response.body, questions);
    });

    it('add clinic criteria', async () => {
        const {userLogin, clinics, questions} = await generateFixtures().presetLeaderWithManyClinics();

        const clinic = clinics[0];

        const newQuestion = {
            clinic_id: clinic.id,
            description: 'question description',
            question_kind: 'numeric',
            title: 'a question',
            answers: [{
                rank: 1,
                body: 'answer 1'
            }, {
                rank: 3,
                body: 'answer 2'
            }]
        };

        const response = await request({
            method: 'post',
            url: `/api/leader_clinics/${clinic.id}/criteria`,
            cookie: `loginId=${userLogin.id}`,
            body: newQuestion
        });

        assert.equal(response.status, 201);

        newQuestion.id = response.body.id;
        newQuestion.leader_id = response.body.leader_id;
        newQuestion.removed = false;
        newQuestion.answers = newQuestion.answers.map((a, i) => ({
            ...a,
            id: response.body.answers[i].id
        }));

        assertQuestions([response.body], [newQuestion]);

        const clinicQuestionsResponse = await request({
            method: 'get',
            url: `/api/leader_clinics/${clinic.id}/criteria`,
            cookie: `loginId=${userLogin.id}`
        });

        assertQuestions(clinicQuestionsResponse.body,
                        [newQuestion].concat(questions[0]));
    });

    it('update clinic criteria', async () => {
        const {userLogin, clinics, questions} = await generateFixtures().presetLeaderWithManyClinics();

        const originalQuestion = questions[0];
        const clinic = clinics[0];

        const updatedQuestion = {
            ...originalQuestion,
            description: 'a new description'
        };

        const response = await request({
            method: 'put',
            url: `/api/leader_clinics/${clinic.id}/criteria/${originalQuestion.id}`,
            cookie: `loginId=${userLogin.id}`,
            body: updatedQuestion
        });

        assert.equal(response.status, 200);

        assertQuestions([response.body], [updatedQuestion]);

        const clinicQuestionsResponse = await request({
            method: 'get',
            url: `/api/leader_clinics/${clinic.id}/criteria`,
            cookie: `loginId=${userLogin.id}`
        });

        assertQuestions(clinicQuestionsResponse.body,
                        [updatedQuestion]);
    });

    it('update clinic criteria', async () => {
        const {userLogin, clinics, questions} = await generateFixtures().presetLeaderWithManyClinics();

        const originalQuestion = questions[0];
        const clinic = clinics[0];

        const updatedQuestion = {
            ...originalQuestion,
            description: 'a new description'
        };

        const response = await request({
            method: 'put',
            url: `/api/leader_clinics/${clinic.id}/criteria/${originalQuestion.id}`,
            cookie: `loginId=${userLogin.id}`,
            body: updatedQuestion
        });

        assert.equal(response.status, 200);

        assertQuestions([response.body], [updatedQuestion]);

        const clinicQuestionsResponse = await request({
            method: 'get',
            url: `/api/leader_clinics/${clinic.id}/criteria`,
            cookie: `loginId=${userLogin.id}`
        });

        assertQuestions(clinicQuestionsResponse.body,
                        [updatedQuestion]);
    });

    it('update criterion without answer ids - add them anyway', async () => {
        const {userLogin, clinics, questions} = await generateFixtures().presetLeaderWithManyClinics();

        const originalQuestion = questions[0];
        const clinic = clinics[0];

        const updatedQuestion = {
            ...originalQuestion,
            answers: _.map(originalQuestion.answers, a => _.omit(a, 'id'))
        };

        const response = await request({
            method: 'put',
            url: `/api/leader_clinics/${clinic.id}/criteria/${originalQuestion.id}`,
            cookie: `loginId=${userLogin.id}`,
            body: updatedQuestion
        });

        assert.equal(response.status, 200);

        updatedQuestion.answers[0].id = response.body.answers[0].id;
        assertQuestions([response.body], [updatedQuestion]);

        const clinicQuestionsResponse = await request({
            method: 'get',
            url: `/api/leader_clinics/${clinic.id}/criteria`,
            cookie: `loginId=${userLogin.id}`
        });

        assertQuestions(clinicQuestionsResponse.body,
                        [updatedQuestion]);
    });
});

function assertQuestions(actual, expected) {
    actual = _.orderBy(actual, q => q.id);
    expected = _.orderBy(expected, q => q.id);

    const actualQuestions = actual.map(q => _.omit(q, 'createdAt', 'updatedAt'));

    assert.deepEqual(actualQuestions, expected.map(q => ({
        ...q,
        answers: q.answers.map(a => _.omit(a, 'question_id'))
    })));

    actual.forEach(q => {
        assert.isOk(q.createdAt);
        assert.isOk(q.updatedAt);
    });
}
