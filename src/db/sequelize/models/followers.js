"use strict";
module.exports = (sequelize, DataTypes) => {
    const followers = sequelize.define(
        "followers",
        {
            id: { type: DataTypes.UUID, primaryKey: true },
            user_id: DataTypes.UUID,
            leader_id: DataTypes.UUID,
            clinic_id: DataTypes.UUID,
            status: DataTypes.INTEGER,
            frozen: DataTypes.BOOLEAN,
        },
        { underscored: true }
    );

    followers.associate = (models) => {
        followers.belongsTo(models.users);
        followers.hasMany(models.resonators);
        followers.hasMany(models.follower_group_followers);
    };

    return followers;
};
