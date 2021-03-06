"use strict";
module.exports = (sequelize, DataTypes) => {
    const clinics = sequelize.define(
        "clinics",
        {
            id: { type: DataTypes.UUID, primaryKey: true },
            user_id: DataTypes.UUID,
            name: DataTypes.STRING,
        },
        { underscored: true }
    );

    clinics.associate = (models) => {
        clinics.belongsTo(models.users);
    };

    return clinics;
};
