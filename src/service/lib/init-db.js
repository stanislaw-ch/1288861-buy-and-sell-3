"use strict";

const defineModels = require(`../models`);
const Aliases = require(`../models/aliases`);

module.exports = async (sequelize, {categories, offers, users}) => {
  const {Category, Offer, User} = defineModels(sequelize);
  await sequelize.sync({force: true});

  const categoryModels = await Category.bulkCreate(
      categories.map((item) => ({name: item}))
  );

  const categoryIdByName = categoryModels.reduce((acc, next) => ({
    [next.name]: next.id,
    ...acc
  }), {});

  const userModels = await User.bulkCreate(users, {include: [Aliases.OFFERS, Aliases.COMMENTS]});

  const userIdByEmail = userModels.reduce((acc, next) => ({
    [next.email]: next.id,
    ...acc
  }), {});

  offers.forEach((offer) => {
    offer.userId = userIdByEmail[offer.user];
    offer.comments.forEach((comment) => {
      comment.userId = userIdByEmail[comment.user];
    });
  });

  const offerPromises = offers.map(async (offer) => {
    const offerModel = await Offer.create(offer, {include: [Aliases.COMMENTS]});
    await offerModel.addCategories(
        offer.categories.map(
            (name) => categoryIdByName[name]
        )
    );
  });
  await Promise.all(offerPromises);
};
