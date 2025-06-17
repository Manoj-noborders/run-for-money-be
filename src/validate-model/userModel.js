var Joi = require('joi');
module.exports.pagination = Joi.object({
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required()
});
module.exports.getAllUserList = Joi.object({
  seriesId: Joi.number().required(),
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required()
});
module.exports.setLeagueLp = Joi.object({
  leagueId: Joi.number().required(),
  rating: Joi.number().required()
});
module.exports.getAllUserLeagueRankBySeries = Joi.object({
  seriesId: Joi.number().required()
});
module.exports.getAllUserLeagueRankByLeague = Joi.object({
  leagueId: Joi.number().required()
});
module.exports.leaguePagination = Joi.object({
  leagueId: Joi.number().required(),
  seriesId: Joi.number().required(),
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required()
});
module.exports.getTopUsers = Joi.object({
  dd: Joi.string().required(),
  m: Joi.string().required(),
  yy: Joi.string().required(),
  hh: Joi.string().required(),
  mm: Joi.string().required()
});
module.exports.createUpdateDeck = Joi.object({
  json: Joi.string().required()
});
module.exports.setDeviceToken = Joi.object({
  deviceToken: Joi.string().required()
});
module.exports.updateUserLeagueDetails = Joi.object({
  seriesId: Joi.number().required(),
  rating: Joi.number().required(),
  battles: Joi.number().required(),
  wins: Joi.number().required(),
  loose: Joi.number().allow('').allow(null).optional(),
  draw: Joi.number().allow('').allow(null).optional(),
  maxStreak: Joi.number().required(),
  rewards: Joi.number().required()
});
module.exports.updateUserLeagueDetailsV2 = Joi.object({
  seriesId: Joi.number().required(),
  rating: Joi.number().required(),
  battles: Joi.number().required(),
  wins: Joi.number().required(),
  loose: Joi.number().allow('').allow(null).optional(),
  draw: Joi.number().allow('').allow(null).optional(),
  maxStreak: Joi.number().required(),
  rewards: Joi.number().required(),
  aiUserId: Joi.number().allow('').allow(null).optional(),
  aiUserSeriesId: Joi.number().allow('').allow(null).optional(),
  aiUserRating: Joi.number().allow('').allow(null).optional(),
  aiUserBattles: Joi.number().allow('').allow(null).optional(),
  aiUserWins: Joi.number().allow('').allow(null).optional(),
  aiUserLoose: Joi.number().allow('').allow(null).optional(),
  aiUserDraw: Joi.number().allow('').allow(null).optional(),
  aiUserMaxStreak: Joi.number().allow('').allow(null).optional(),
  aiUserRewards: Joi.number().allow('').allow(null).optional()
});
module.exports.updateUserLeagueDetailsV3 = Joi.object({
  seriesId: Joi.number().required(),
  rating: Joi.number().required(),
  battles: Joi.number().required(),
  wins: Joi.number().required(),
  loose: Joi.number().allow('').allow(null).optional(),
  draw: Joi.number().allow('').allow(null).optional(),
  maxStreak: Joi.number().required(),
  rewards: Joi.number().required(),
  aiUserId: Joi.number().allow('').allow(null).optional(),
  aiUserSeriesId: Joi.number().allow('').allow(null).optional(),
  aiUserRating: Joi.number().allow('').allow(null).optional(),
  aiUserBattles: Joi.number().allow('').allow(null).optional(),
  aiUserWins: Joi.number().allow('').allow(null).optional(),
  aiUserLoose: Joi.number().allow('').allow(null).optional(),
  aiUserDraw: Joi.number().allow('').allow(null).optional(),
  aiUserMaxStreak: Joi.number().allow('').allow(null).optional(),
  aiUserRewards: Joi.number().allow('').allow(null).optional(),
  dualId: Joi.number().required(),
  battleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW'),
  aiBattleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW', '', null),
  aiDualId: Joi.number().allow('').allow(null).optional()
});

module.exports.updateUserLeagueDetailsV5 = Joi.object({
  userId: Joi.number().required(),
  seriesId: Joi.number().required(),
  rating: Joi.number().required(),
  battles: Joi.number().required(),
  wins: Joi.number().required(),
  loose: Joi.number().allow('').allow(null).optional(),
  draw: Joi.number().allow('').allow(null).optional(),
  maxStreak: Joi.number().required(),
  rewards: Joi.number().required(),
  aiUserId: Joi.number().allow('').allow(null).optional(),
  aiUserSeriesId: Joi.number().allow('').allow(null).optional(),
  aiUserRating: Joi.number().allow('').allow(null).optional(),
  aiUserBattles: Joi.number().allow('').allow(null).optional(),
  aiUserWins: Joi.number().allow('').allow(null).optional(),
  aiUserLoose: Joi.number().allow('').allow(null).optional(),
  aiUserDraw: Joi.number().allow('').allow(null).optional(),
  aiUserMaxStreak: Joi.number().allow('').allow(null).optional(),
  aiUserRewards: Joi.number().allow('').allow(null).optional()
});


// //Payload validator model for updating league within seasons
module.exports.updateUserLeagueDetailsV6 = Joi.object({
  userId: Joi.number().required(),
  leagueId: Joi.number().required(),
  seriesId: Joi.number().required(),
  rating: Joi.number().required(),
  battles: Joi.number().required(),
  wins: Joi.number().required(),
  loose: Joi.number().allow('').allow(null).optional(),
  draw: Joi.number().allow('').allow(null).optional(),
  maxStreak: Joi.number().required(),
  rewards: Joi.number().required(),
  aiUserId: Joi.number().allow('').allow(null).optional(),
  aiUserSeriesId: Joi.number().allow('').allow(null).optional(),
  aiUserRating: Joi.number().allow('').allow(null).optional(),
  aiUserBattles: Joi.number().allow('').allow(null).optional(),
  aiUserWins: Joi.number().allow('').allow(null).optional(),
  aiUserLoose: Joi.number().allow('').allow(null).optional(),
  aiUserDraw: Joi.number().allow('').allow(null).optional(),
  aiUserMaxStreak: Joi.number().allow('').allow(null).optional(),
  aiUserRewards: Joi.number().allow('').allow(null).optional()
});



module.exports.uploadFileAsset = Joi.object({
  name: Joi.string().required()
});
module.exports.updateUsertcgAvatar = Joi.object({
  tcgAvatar: Joi.string().required()
});
module.exports.destroyDeviceWithWalletAddress = Joi.object({
  walletAddress: Joi.string().required()
});
module.exports.getAllUserLeaguesBySeriesId = Joi.object({
  seriesId: Joi.number().required(),
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required()
});
module.exports.checkDeviceID = Joi.object({
  deviceId: Joi.string().required()
});
exports.userLiveStreams = Joi.object({
  id: Joi.number().required(),
  userId: Joi.number().required()
})
exports.minFuelParams = Joi.object({
  userId: Joi.number().required(),
  isHaveMinFuel: Joi.boolean().required()
})
module.exports.incrementBattleServerSide = Joi.object({
  userId: Joi.number().required()
});

module.exports.liveStreamsData = Joi.object({
  user_id: Joi.number().required(),
  url: Joi.string().required(),
  startTime: Joi.date().required()
})

module.exports.liveStreamsDataUpdate = Joi.object({
  id: Joi.number().required(),
  endTime: Joi.date().required()
})

module.exports.resetBlockChainData = Joi.object({
  userId: Joi.number().optional(),
  rating: Joi.number().optional(),
  leagueId: Joi.number().required(),
  fuel: Joi.number().optional(),
  wallet: Joi.string()
})


exports.getUserCardsCounts = Joi.object({
  userId: Joi.number().required(),
  seasonId: Joi.number().required()
})


exports.addUserCardsCount = Joi.object({
  userId: Joi.number().required(),
  seasonId: Joi.number().required(),
  cards: Joi.number().required()
})

exports.setUserAvatar = Joi.object({
  index: Joi.number().integer().min(0).required(),
  name: Joi.string().optional()
})

exports.setRfmFirstLogin = Joi.object({
  new_login: Joi.boolean().required()
})

exports.walletParam = Joi.object({
  wallet: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/).required()
    .messages({
      'string.pattern.base': 'Invalid Ethereum wallet address. It should start with 0x and followed by 40 hexadecimal characters.',
      'any.required': 'Wallet address is a required field.'
    })
});


exports.pagination = Joi.object({
  pageNumber: Joi.number().integer().min(1).max(100000).required(),
  pageSize: Joi.number().integer().min(1).max(500).required()
});

exports.userIdWithWalletBody = Joi.object({
  userId: Joi.number().optional(),
  wallet: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/).optional()
    .messages({
      'string.pattern.base': 'Invalid Ethereum wallet address. It should start with 0x and followed by 40 hexadecimal characters.',
      'any.required': 'Wallet address is a required field.'
    })
})

module.exports.userAbilityDto = Joi.object({
  abilityName: Joi.string().required()
});

module.exports.assetJsonDto = Joi.object({
  id: Joi.number().min(1).required()
});


module.exports.image_urlSchema = Joi.object({
  image_url: Joi.string().required()
});