import _ from 'lodash';
import Repository from './Repository';

import {
    resonators,
    questions,
    resonator_questions,
    resonator_answers
} from '../sequelize/models';

import ResonatorStats from '../../domain/entities/resonatorStats';

class ResonatorStatsRepository extends Repository {
    constructor(...args) {
        super(...args);
    }

    toDbEntity(resonatorStats) {
        return {
            ...resonatorStats
        };
    }

    save(resonatorStats, transaction, lastResonatorStats) {
        const answers = this.getNewStats(resonatorStats, lastResonatorStats);
        const promises = answers.map(a => resonator_answers.create(a, {transaction}));
        return Promise.all(promises);
    }

    getNewStats(resonatorStats, lastResonatorStats) {
        const arr = [];

        for (const qid of Object.keys(resonatorStats.criteria)) {
            const answers = resonatorStats.criteria[qid];
            const lastAnswers = lastResonatorStats.criteria[qid] || [];

            for (const answer of answers) {
                if (!_.find(lastAnswers, a => a.id === answer.id)) {
                    arr.push(answer);
                }
            }
        }

        return arr;
    }

    async findByPk(resonator_id) {
        const rows = await resonator_answers.findAll({
            include: [{
                required: true,
                model: resonator_questions,
                include: [{
                    model: resonators,
                    where: {id: resonator_id}
                },
                questions]
            }],

            order: [
                ['createdAt', 'DESC']
            ]
        });

        const questionAnswerPair = rows.map(r => {
            const question_id = r.resonator_question.question_id;
            const id = r.get('id');
            const resonator_question_id = r.get('resonator_question_id');
            const answer_id = r.get('answer_id');
            const sent_resonator_id = r.get('sent_resonator_id');
            const createdAt = r.get('createdAt');

            return {
                id,
                resonator_question_id,
                question_id,
                answer_id,
                sent_resonator_id,
                createdAt
            };
        });

        let questionGroup = _.groupBy(questionAnswerPair, p => p.question_id);

        questionGroup = _.reduce(Object.keys(questionGroup), (acc, cur) => {
            const answers = questionGroup[cur];
            
            // const lastAnswerPerDay = _(answers)
            //     .orderBy('createdAt', ['desc'])
            //     .sortedUniqBy(a => `${a.question_id}#${this._getUtcDay(a.createdAt)}`)
            //     .value();

            acc[cur] = answers.map(a => _.omit(a, 'question_id', 'updatedAt'));
            return acc;
        }, {});

        const resonatorStats = new ResonatorStats({
            resonator_id,
            criteria: questionGroup
        });

        this.trackEntity(resonatorStats);

        return resonatorStats;
    }

    _getUtcDay(timestamp) {
        return Math.floor(new Date(timestamp).getTime() / (1000 * 3600 * 24));
    }
}

export default new ResonatorStatsRepository();
