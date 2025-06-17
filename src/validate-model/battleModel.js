var Joi = require('joi');

module.exports.addBattle = Joi.object({
  userId: Joi.number().required(),
  seriesId: Joi.number().required(),
  status: Joi.string().required()
});
module.exports.updateBattle = Joi.object({
  battleId: Joi.number().required(),
  seriesId: Joi.number().required(),
  status: Joi.string().required()
});
module.exports.getAllBattlesBySeriesId = Joi.object({
  seriesId: Joi.number().required(),
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required()
});
module.exports.getTopBattles = Joi.object({
  seriesId: Joi.number().required(),
  leagueId: Joi.number().required()
});
module.exports.incrementUserBattleV2 = Joi.object({
  aiUserId: Joi.number().allow('').allow(null).optional()
});
module.exports.incrementUserBattleV3 = Joi.object({
  // aiUserId: Joi.number().allow("").allow(null).optional(),
  oponentId: Joi.number().allow('').allow(null).optional()
  //aiFreeUserId: Joi.number().allow("").allow(null).optional()
});

module.exports.startBattleModel = Joi.object({
  hunterId: Joi.array().items(Joi.number()).required(),
  runnerId: Joi.array().items(Joi.number()).required(),
  // roomId: Joi.string().required(),
  // battleId: Joi.string().required(),
  // leagueId: Joi.number().required(),
  seasonId: Joi.number().optional()
});

exports.endUserBattle = Joi.object({
  seriesId: Joi.number().required(),
  rating: Joi.number().required(),
  battles: Joi.number().required(),
  wins: Joi.number().required(),
  loose: Joi.number().allow('').allow(null).optional(),
  draw: Joi.number().allow('').allow(null).optional(),
  maxStreak: Joi.number().required(),
  rewards: Joi.number().required(),
  dualId: Joi.number().required(),
  battleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW')
});
exports.endUserBattleUnityServer = Joi.object({
  userId: Joi.number().required(),
  seriesId: Joi.number().required(),
  rating: Joi.number().required(),
  battles: Joi.number().required(),
  wins: Joi.number().required(),
  loose: Joi.number().allow('').allow(null).optional(),
  draw: Joi.number().allow('').allow(null).optional(),
  maxStreak: Joi.number().required(),
  rewards: Joi.number().required(),
  dualId: Joi.number().required(),
  battleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW')
});

exports.startUserBattleServerSide = Joi.object({
  userId: Joi.number().required(),
  oponentId: Joi.number().required(),
  battleId: Joi.string().required()
});

exports.loginStatusForRfmBattle = Joi.object({
  rfmBattleStatus: Joi.boolean().required()
});

exports.endUserBattleUnityServerV2 = Joi.object({
  p1_id: Joi.number().required(),
  p2_id: Joi.number().required(),
  p1_seriesId: Joi.number().required(),
  p2_seriesId: Joi.number().required(),
  p1_rating: Joi.number().required(),
  p2_rating: Joi.number().required(),
  p1_battles: Joi.number().required(),
  p2_battles: Joi.number().required(),
  p1_wins: Joi.number().required(),
  p2_wins: Joi.number().required(),
  p1_loose: Joi.number().allow('').allow(null).optional(),
  p2_loose: Joi.number().allow('').allow(null).optional(),
  p1_draw: Joi.number().allow('').allow(null).optional(),
  p2_draw: Joi.number().allow('').allow(null).optional(),
  p1_maxStreak: Joi.number().required(),
  p2_maxStreak: Joi.number().required(),
  p1_rewards: Joi.number().required(),
  p2_rewards: Joi.number().required(),
  dualId: Joi.number().required(),
  p1_battleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW'),
  p2_battleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW'),
  // lp_winner: Joi.number().required(),
  // lp_loser: Joi.number().required()
});


exports.duelId = Joi.object({
  duelId: Joi.number().integer().min(1).required()
});



const forceEndBattle = Joi.object({
  dualId: Joi.string().required(),
  userWallet: Joi.string()
    .required()
    .regex(/^(0x)?[0-9a-fA-F]{40}$/) // Regex for addresses
    .message('Invalid userWallet format'), // Custom error message
  oponentWallet: Joi.string()
    .required()
    .regex(/^(0x)?[0-9a-fA-F]{40}$/) // Regex for addresses
    .message('Invalid oponentWallet format'), // Custom error message
});


exports.validateEndBattle = function (req, res, next) {
  const { error } = forceEndBattle.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid request data', error: error.details[0].message, });
  }
  next()
}

exports.endBattleFinal = Joi.object({
  dualId: Joi.number().required(),
  hunterId: Joi.array().items(Joi.number()).required(),
  runnerId: Joi.array().items(Joi.number()).required(),
  hunter_battleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW').required(),
  runner_battleStatus: Joi.string().valid('WIN', 'LOOSE', 'DRAW').required(),
  runnerData: Joi.array().items(Joi.object({
    userId: Joi.number().required(),
    isEscaped: Joi.boolean().required()
  })),
  hunterData: Joi.array().items(Joi.object({
    userId: Joi.number().required(),
    catches: Joi.number().required()
  })),
  is_glitch: Joi.boolean().optional(),
  // user_seriesId: Joi.number().optional(),
  // opponent_seriesId: Joi.number().optional(),
  // user_rating: Joi.number().optional(),
  // opponent_rating: Joi.number().optional(),
  // user_battles: Joi.number().optional(),
  // opponent_battles: Joi.number().optional(),
  // user_wins: Joi.number().optional(),
  // opponent_wins: Joi.number().optional(),
  // user_loose: Joi.number().allow('').allow(null).optional(),
  // opponent_loose: Joi.number().allow('').allow(null).optional(),
  // user_draw: Joi.number().allow('').allow(null).optional(),
  // opponent_draw: Joi.number().allow('').allow(null).optional(),
  // user_maxStreak: Joi.number().optional(),
  // opponent_maxStreak: Joi.number().optional(),
  // user_rewards: Joi.number().optional(),
  // opponent_rewards: Joi.number().optional(),
});

exports.userId = Joi.object({
  userId: Joi.number().min(1).required(),
});

exports.dummyUserDto = Joi.object({
  leagueName: Joi.string().required(),
  latencyRegion: Joi.string().required(),
  latencyCount: Joi.number().min(1).required(),
  queueName: Joi.string().required(),
  titleId: Joi.string().required(),
  giveUpAfterSeconds: Joi.number().min(1).required(),
});


const hunterDataSchema = Joi.array().items(
  Joi.object({
    user_id: Joi.number().integer().required(),
    caught_runners: Joi.array().items(Joi.number().integer().optional()).required()
  })
).required();

const runnerDataSchema = Joi.array().items(
  Joi.object({
    user_id: Joi.number().integer().required(),
    is_caught: Joi.boolean().required(),
    time_survived: Joi.number().integer().required()
  })
).required();

exports.endBattleSchemaV2 = Joi.object({
  battleId: Joi.number().integer().required(),
  winning_team: Joi.string().valid('hunter', 'runner').required(),
  hunter_data: hunterDataSchema,
  runner_data: runnerDataSchema
});

exports.startBattleV2Schema = Joi.object({
  hunterIds: Joi.array().items(Joi.number().integer().min(1)).required(),
  runnerIds: Joi.array().items(Joi.number().integer().min(1)).required(),
  roomId: Joi.string().required(),
});

exports.leaderBoardSchema = Joi.object({
  type: Joi.string().valid('daily', 'weekly').required(),
  page: Joi.number().integer().min(1).required(),
  limit: Joi.number().integer().min(1).max(300).required()
});


// Joi validation schema
const uploadSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  duelId: Joi.number().integer().positive().required(),
  entityType: Joi.string().trim().min(1).max(255).valid('USER', 'SERVER').required()
});

// Middleware for Joi validation
exports.validateUpload = (req, res, next) => {
  // Validate body parameters
  const { error } = uploadSchema.validate({
    userId: req.body.userId,
    duelId: req.body.duelId,
    entityType: req.body.entityType
  });

  // Check if there's a validation error
  if (error) {
    return res.status(400).json({
      error: 'Validation Failed',
      details: error.details.map(detail => detail.message)
    });
  }

  // console.info(req)
  const logFile = req.files?.logFile;
  // Validate file
  if (!req.files) {
    return res.status(400).json({ sucess: false, error: 'FILE_REQUIRED', msg: 'No file uploaded' });
  } else if (!logFile) {
    return res.status(400).json({ sucess: false, error: 'FILE_REQUIRED', msg: 'logFile key is required' });
  }

  // Additional file validations
  const allowedMimeTypes = [
    'text/plain',  // for binary text files
    'application/octet-stream'
  ];

  if (!allowedMimeTypes.includes(logFile.mimetype)) {
    return res.status(400).json({
      sucess: false,
      error: 'INVALID_FILE_TYPE',
      msg: 'Invalid file type. Only binary text files are allowed',
    });
  }

  const MAX_FILE_SIZE = 2 * 1024 * 1024;  // 2MB
  // Max file size additional check
  if (logFile.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: 'FILE_TOO_LARGE',
      msg: `File too large. Max size is ${MAX_FILE_SIZE}MB`,
    });
  }

  next();
};

exports.userIdOpt = Joi.object({
  userId: Joi.number().optional(),
});

exports.gamePlayerConfigDto = Joi.object({
  hunterCount: Joi.number().integer().positive().required(),
  runnerCount: Joi.number().integer().positive().required(),
  hunterSpeed: Joi.number().integer().positive().required(),
  runnerSpeed: Joi.number().integer().positive().required(),
});

