import log from '../logging';
import followerRepository from '../db/repositories/FollowerRepository';
import resonatorRepository from '../db/repositories/ResonatorRepository';
import leaderRepository from '../db/repositories/LeaderRepository';
import userRepository from '../db/repositories/UserRepository';
import User from '../domain/entities/user';
import Follower from '../domain/entities/follower';
import * as dtoFactory from './dto/index';
import getUow from './getUow';
import FollowerGroupFollowersRepository from '../db/repositories/FollowerGroupFollowersRepository';

export async function getLeaderFollowers(user_id) {
    const followers = await followerRepository.findByLeaderUserId(user_id);
    const followersDto = followers.map(dtoFactory.toFollower);
    return followersDto;
}

export async function getLeader(leader_id) {
    const leader = await leaderRepository.findByPk(leader_id);
    const dto = dtoFactory.toLeader(leader);
    return dto;
}
export async function addLeaderFollower({ leader_id, clinic_id, email, name, password }) {
    const user = new User({ name, email, pass: password });

    const follower = new Follower({
        user_id: user.id,
        leader_id,
        clinic_id,
        status: 2,
        frozen: false,
    });

    const uow = getUow();

    uow.trackEntity(user, { isNew: true });
    uow.trackEntity(follower, { isNew: true });

    await uow.commit();

    const newFollower = await followerRepository.findByPk(follower.id);
    const followerDto = dtoFactory.toFollower(newFollower);
    return {
        ...followerDto,
        user: {
            name, email
        }
    };
}

export async function deleteLeaderFollower(followerId) {
    const followerGroups = await FollowerGroupFollowersRepository.findGroupsByFollowerId(followerId);
    return await Promise.all([
        ...(followerGroups.map(async (fg) => await FollowerGroupFollowersRepository.delete(fg.id, followerId))),
        followerRepository.deleteById(followerId),
        resonatorRepository.deleteByFollowerId(followerId)
    ]);
}

export async function updateFollowerUser(followerId, newUserDetails) {
    const user = await userRepository.findByFollowerId(followerId);
    user.email = newUserDetails.email;
    user.name = newUserDetails.name;
    await getUow().commit();
}

export async function freezeFollower(followerId) {
    const follower = await followerRepository.findByPk(followerId);

    if (follower) {
        log.info(`Freezing follower ${followerId}`);
        follower.freeze();
        await getUow().commit();
        return true;
    }
}

export async function unfreezeFollower(followerId) {
    const follower = await followerRepository.findByPk(followerId);

    if (follower) {
        log.info(`Unfreezing follower ${followerId}`);
        follower.unfreeze();
        await getUow().commit();
        return true;
    }
}
