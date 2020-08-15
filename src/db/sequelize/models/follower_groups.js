'use strict';
module.exports = function (sequelize, DataTypes) {
  var follower_groups = sequelize.define('follower_groups', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    group_name: DataTypes.STRING,
    leader_id: DataTypes.UUID,
    clinic_id: DataTypes.UUID,
    status: DataTypes.INTEGER,
    frozen: DataTypes.BOOLEAN
  }, {
    underscored: true,
    classMethods: {
      associate: function (models) {
        follower_groups.belongsTo(models.leaders);
        follower_groups.belongsTo(models.clinics);
        follower_groups.hasMany(models.resonators);
        follower_groups.hasMany(models.follower_group_followers);
      }
    }
  });
  return follower_groups;
};
