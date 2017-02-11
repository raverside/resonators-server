const loadOrder = [
    './users.js',
    './user_logins',
    './leaders',
    './clinics',
    './followers',
    './resonators',
    './resonator_attachments'
];

const promiseChain = () => {
    return loadOrder.reduce((acc, cur) => {
        return acc.then(() => require(cur).default());
    }, Promise.resolve());
};

export default () => {
    return promiseChain();
};
