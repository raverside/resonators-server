import _ from 'lodash';
import proxyquire from 'proxyquire';
import generateFixtures from '../dbFixtures/fixtureGenerator';
import waitFor from 'wait-for-cond';
import sinon from 'sinon';
import {resonators, sent_resonators} from '../../src/db/sequelize/models';
import {assert} from 'chai';
import moment from 'moment';
import {getArgsOf} from '../utils';

describe('email scheduler', () => {
    let startEmailSchedulingLoop, stopEmailSchedulingLoop, sendResonatorEmailStub;

    beforeEach(() => {
        sendResonatorEmailStub = sinon.stub().returns(Promise.resolve());

        const stubs = {
            './sendResonatorEmail':{
                default: sendResonatorEmailStub,
                '@global': true
            }
        };

        const scheduleEmailsLoop = proxyquire('../../src/emailScheduler/index', stubs);
        startEmailSchedulingLoop = scheduleEmailsLoop.startEmailSchedulingLoop;
        stopEmailSchedulingLoop = scheduleEmailsLoop.stopEmailSchedulingLoop;
    });

    afterEach(() => {
        stopEmailSchedulingLoop();
    });

    describe('schedule pending resonator', async () => {
        let r1, r2;

        beforeEach(async () => {
            [r1,r2] = await generateFixtures()
                            .generateResonator({
                                fields: {
                                    repeat_days: '0,1,2,3,4,5,6',
                                    pop_time: '2016-04-05 14:00:00'
                                }})
                            .generateResonator({
                                fields: {
                                    repeat_days: '0,1,2,3,4,5,6',
                                    pop_time: '2016-04-05 14:00:00'
                                }
                            })
                            .done();

            startEmailSchedulingLoop();

            await waitFor(() => sendResonatorEmailStub.calledWithMatch({
                subject: r1.title
            }) && sendResonatorEmailStub.calledWithMatch({
                subject: r2.title
            }), 5000);
        });

        it('send both resonators', () => {
            assert(resonatorEmailCalledWithMatch(sendResonatorEmailStub, r1), 'r1 was not called properly.');
            assert(resonatorEmailCalledWithMatch(sendResonatorEmailStub, r2), 'r2 was not called properly.');
        });

        it('html', async () => {
            const sentResonatorRow = await sent_resonators.findOne({where: {resonator_id: r1.id}});
            const sentResonatorId = sentResonatorRow.get('id');

            const args = getArgsOf(sendResonatorEmailStub,
                                   args => args[0].subject === r1.title);

            const html = args[0].html;
            assert.include(html, r1.content, 'html must include the resonator title');
            assert.include(html, r1.link, 'html must include the resonator link');
            assert.include(html, 'showFromMail', 'html must include the answer link');
            assert.include(html, sentResonatorId, 'html must include the sent_resonator id');
        });
    }).timeout(5000);

    it('don\'t schedule non-pending resonators', async () => {
        const [r1] = await generateFixtures()
                        .generateResonator({
                            fields: {
                                repeat_days: '0,1,2,3,4,5,6',
                                pop_time: '2016-01-01',
                                last_pop_time: '2133-01-01'
                            }})
                        .done();

        startEmailSchedulingLoop();

        await waitFor(() => sendResonatorEmailStub.calledWithMatch({
            subject: r1.title
        }), 3000).catch(() => {});

        const sendR1Called = sendResonatorEmailStub.calledWithMatch({
            to: r1.follower.user.email,
            subject: r1.title,
            html: sinon.match(
                txt => _.includes(txt, r1.link) &&
                       _.includes(txt, r1.content)
            )
        });

        const r1Call = resonatorEmailCalledWithMatch(sendResonatorEmailStub, r1);
        assert.isFalse(r1Call, 'r1 was called, even though it should not have been.');
    }).timeout(5000);

    it('set last_pop_time in the sent resonators', async () => {
        const [r1] = await generateFixtures()
                        .generateResonator({
                            fields: {
                                repeat_days: '0,1,2,3,4,5,6',
                                pop_time: '2016-01-01'
                            }})
                        .done();

        startEmailSchedulingLoop();

        let row;
        await waitFor(() => {
            resonators.findById(r1.id).then(r => {row = r;});
            return row && row.get('last_pop_time');
        }, 5000);

        const lastPopTime = row.get('last_pop_time');

        assert.isAbove(moment(lastPopTime), moment().startOf('d'));
    });

    it('record sent resonators in the sent_resonators table', async () => {
        const [r1] = await generateFixtures()
                        .generateResonator({
                            fields: {
                                repeat_days: '0,1,2,3,4,5,6',
                                pop_time: '2016-01-01'
                            }})
                        .done();

        startEmailSchedulingLoop();

        await waitFor(() => sendResonatorEmailStub.called, 5000);

        const row = await sent_resonators.findOne({ where: { resonator_id: r1.id }});
        assert.isFalse(row.get('failed'));
    });

    function resonatorEmailCalledWithMatch(spy, resonatorFixture) {
        return spy.calledWithMatch({
            to: resonatorFixture.follower.user.email,
            subject: resonatorFixture.title,
            html: sinon.match(
                txt => _.includes(txt, resonatorFixture.link) &&
                       _.includes(txt, resonatorFixture.content)
            )
        });
    }
});
