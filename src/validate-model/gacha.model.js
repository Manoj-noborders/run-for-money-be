const Joi = require('joi');

// Individual attribute schemas
const userId = Joi.number().integer().required();
const gachaId = Joi.number().integer().required();
const cost = Joi.number().required();
const currency = Joi.string().valid('gold', 'fiat', 'token').required();
const ticketId = Joi.number().integer().required();
const gachaType = Joi.string().valid('parameter', 'item', 'skill').required();
const gachaSpinId = Joi.number().integer().required();
const abilityId = Joi.number().integer().required();

// Conditional validation for txn_hash
const txn_hash = Joi.string().when('currency', {
    is: Joi.valid('fiat', 'token'),
    then: Joi.required(),
    otherwise: Joi.optional().allow(null, '')
});

// Concatenated schemas for specific endpoints
const purchaseGachaTicketSchema = Joi.object({
    gachaId,
    cost,
    txn_hash,
    currency
});

const spinGachaSchema = Joi.object({
    ticketId,
    gachaType
});

const spinGachaSchemaV2 = Joi.object({
    spinCount: Joi.number().valid(1, 10).required(),
    gachaType,
    spendJewels: Joi.boolean().optional()
});

const applyParameterGachaResultSchema = Joi.object({
    userId,
    gachaSpinId
});

const burnSpclSkillSchema = Joi.object({
    userId,
    abilityId
});

const gachaItemSchema = Joi.object({
    itemType: gachaType.optional(),
});

const pagination = Joi.object({
    page: Joi.number().integer().min(1).required(),
    size: Joi.number().integer().min(1).max(100).required(),
});


const userGachaSpinLogs = Joi.object({
    // userId,
    gachaId,
}).concat(pagination);

module.exports = {
    purchaseGachaTicketSchema,
    spinGachaSchema,
    applyParameterGachaResultSchema,
    burnSpclSkillSchema,
    gachaItemSchema,
    spinGachaSchemaV2,
    userGachaSpinLogs,
};