import Resonator from '../domain/entities/resonator';
import resonatorRepository from '../db/repositories/ResonatorRepository';
import questionRepository from '../db/repositories/QuestionRepository';
import * as dtoFactory from './dto/index';
import updatePermittedFields from './updatePermittedFields';
import s3 from '../s3';
import getUow from './getUow';
import { v4 as uuid } from "uuid";

export async function getResonators(followerId) {
    const resonators = await resonatorRepository.findByFollowerId(followerId);
    const resonatorsDto = resonators.map(dtoFactory.toResonator);
    return resonatorsDto;
}

export async function getResonator(reminderId) {
    const resonator = await resonatorRepository.findByPk(reminderId);
    const dto = dtoFactory.toResonator(resonator);
    return dto;
}

export async function createResonator(leader_id, resonatorRequest) {
    const uow = getUow();
    const resonator = new Resonator({
        ...resonatorRequest,
        leader_id
    });

    uow.trackEntity(resonator, { isNew: true });
    await uow.commit();

    const savedResonator = dtoFactory.toResonator(await resonatorRepository.findByPk(resonator.id));
    return savedResonator;
}

export async function updateResonator(resonator_id, updatedFields) {
    const resonator = await resonatorRepository.findByPk(resonator_id);

    if (!resonator)
        return null;

    updatePermittedFields(resonator, updatedFields, [
        'title', 'link', 'description', 'content', 'repeat_days', 'disable_copy_to_leader', 'pop_email', 'pop_time',
        'one_off', 'ttl_policy', 'interaction_type', 'selected_questionnaire', 'questionnaire_details', 'interval'
    ]);

    await getUow().commit();

    const savedResonator = dtoFactory.toResonator(await resonatorRepository.findByPk(resonator_id));
    return savedResonator;
}

export async function removeResonator(resonator_id) {
    await resonatorRepository.deleteById(resonator_id);
    return true;
}

export async function addQuestionToResonator(resonator_id, question_id) {
    const [resonator, question] = await Promise.all([
        resonatorRepository.findByPk(resonator_id),
        questionRepository.findByPk(question_id)
    ]);

    if (!resonator || !question)
        return null;
    resonator.addQuestion(question_id);
    await getUow().commit();
    return true;
}
export async function addBulkQuestionsToResonator(resonator_id, question_ids) {

    for (const question_id of question_ids) {
        const [resonator, question] = await Promise.all([
            resonatorRepository.findByPk(resonator_id),
            questionRepository.findByPk(question_id)
        ]);
        if (!resonator || !question)
            return null;
        resonator.addQuestion(question_id);
    }
    await getUow().commit();
    return true;
}
export async function removeQuestionFromResonator(resonator_id, question_id) {
    const resonator = await resonatorRepository.findByPk(resonator_id);

    if (!resonator)
        return null;

    resonator.removeQuestion(question_id);

    await getUow().commit();

    return true;
}
export async function addItemToResonator(resonator_id, item, stream) {
    const resonator = await resonatorRepository.findByPk(resonator_id);

    if (!resonator)
        return null;

    const id = uuid();

    const { Location } = await s3.uploadImage(id, stream);

    resonator.addItem({
        ...item,
        id,
        link: Location
    });

    await getUow().commit();

    return true;
}

export async function removeResonatorItem(resonator_id, item_id) {
    const resonator = await resonatorRepository.findByPk(resonator_id);

    if (!resonator)
        return null;

    resonator.removeItem(item_id);

    await getUow().commit();

    return true;
}

export async function removeResonatorImage(resonator_id, item_id) {
    const resonator = await resonatorRepository.findByPk(resonator_id);

    if (!resonator)
        return null;

    let imageInfo = resonator.getImageInfo(item_id);

    if (imageInfo) {
        await s3.deleteFile(imageInfo.id);

        resonator.removeItem(item_id);

        await getUow().commit();
    }

    return true;
}
