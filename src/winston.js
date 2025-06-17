//@ts-check
const os = require('os');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const crypto = require('crypto');
const path = require('path');
const logDirectory = path.resolve(os.homedir(), '.pm2/logs/');
const { combine, timestamp, errors, json, label, printf, colorize } = winston.format;

const LogIndentation = {
    None: 0,
    SM: 2, // Small
    MD: 4, // Medium
    LG: 6, // Large
    XL: 8, // XLarge
    XXL: 10,
    XXXL: 12
}

const appVersion = process.env.npm_package_version;
const generateLogId = () => crypto.randomBytes(16).toString('hex');
const timestampFormat = 'YYYY-MM-DD HH:mm:ss.SSS';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    sql: 5,
    debug: 6,
    silly: 7,
};
const myColors = {
    error: 'red',
    warn: 'magenta',
    info: 'cyan',
    http: 'green',
    verbose: 'yellow',
    sql: 'grey', // Add a color for the 'sql' level
    debug: 'brightWhite',
    silly: 'grey',
};

winston.addColors(myColors);
// Logger for API endpoints
const logger = winston.createLogger({
    levels,
    level: 'silly',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: timestampFormat }),
        // json(),
        // printf(({ timestamp, level, message, ...data }) => {
        //     const response = {
        //         level,
        //         timestamp,
        //         message,
        //         // logId: generateLogId(),
        //         // appInfo: {
        //         //     appVersion,
        //         //     environment: process.env.NODE_ENV, // development/staging/production
        //         //     proccessId: process.pid,
        //         // },
        //     };
        //     if (Object.keys(data).length > 0) response.req_meta = data;

        //     return JSON.stringify(response, null, LogIndentation.None);
        // })
        printf(({ timestamp, level, message, ...data }) => {
            let response = `"timestamp": ${timestamp}, "level":${level.toUpperCase()} | ${message}`;
            if (Object.keys(data).length > 0) response += ` ${JSON.stringify(data)}`;
            return response;
        }),
        colorize({ all: true }),
    ),
    transports: [
        new winston.transports.Console(),
        // new winston.transports.File({ filename: path.resolve(os.homedir(), '.pm2/logs/', 'RFM-combined.log'), append: true })
        new DailyRotateFile({
            filename: path.resolve(logDirectory, `RFM-${process.env.NODE_ENV}-%DATE%.log`),
            datePattern: 'YYYY-MM-DD',
            // zippedArchive: true,
            // maxSize: '20m',
            // maxFiles: '30d'
        })
    ],
});



// Custom formatting function for objects
function formatObject(obj) {
    try {
        return JSON.stringify(obj, null, 0);
    } catch (error) {
        return obj.toString();
    }
}

// Override console.log
console.log = function (...args) {
    const formattedArgs = args.map(arg => (typeof arg === 'object' ? formatObject(arg) : arg));
    const message = formattedArgs.join(' ');
    logger.debug(message);
};


function formatHTTPLoggerResponse(req, res, responseBody, requestStartTime) {

    return {
        request: {
            // headers: req.headers,
            host: req.headers.host,
            baseUrl: req.baseUrl,
            body: req.body,
            params: req.params,
            query: req.query,
            clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            user: req.decoded || {},
        },
        response: {
            body: res.statusCode >= 400 ? responseBody : '[REDACTED]',
        }
    };
};

const EXCLUDEDROUTES = ['/api/auth/check-internet'];

const responseInterceptor = function (req, res, next) {
    console.log('responseInterceptor', req.url);
    // If the request URL is in the list of excluded routes, skip logging
    if (EXCLUDEDROUTES.includes(req.url)) {
        next();
    }

    const requestStartTime = Date.now();
    let originalSend = res.send;
    let responseSent = false;

    res.send = function (body) {
        if (!responseSent) {
            let requestDuration = 0;

            if (requestStartTime) {
                const endTime = Date.now() - requestStartTime;
                requestDuration = (endTime / 1000); // ms to s
            }
            let parsedBody = body;

            if (typeof body === 'string') {
                try {
                    parsedBody = JSON.parse(body);
                } catch (error) {
                    // Body is not JSON; leave as-is
                }
            }

            let basic_line = `"status_code":${res.statusCode}, "res_time": ${requestDuration}s, "method": ${req.method}, "url": ${req.url} | req_meta: `;
            let metadata = formatHTTPLoggerResponse(req, res, parsedBody, requestStartTime);

            if (res.statusCode < 400) {
                logger.http(basic_line, metadata);
            } else if (res.statusCode >= 500) {
                logger.error(basic_line, metadata);
            } else {
                logger.warn(basic_line, metadata);
            }

            responseSent = true;
        }

        return originalSend.call(this, body);
    };

    next();
};



console.log('logger initialized', 10, 'hey', 'am i working?');

const globalErrorHandler = (err, req, res, next) => {
    if (err && err.error && err.error.isJoi) {
        // Joi validation error
        return res.status(400).json({
            status: 'error',
            message: 'Invalid User Input',
            details: err.error.details.map((detail) => detail.message), // Map error details for readability
        });
    }

    // Handle other errors
    console.error('Error:', err); // Log the error stack
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
};

// exports.responseInterceptor = responseInterceptor;
// exports.logger = logger;
module.exports = { responseInterceptor, logger, globalErrorHandler };