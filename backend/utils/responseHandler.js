import { logError, logInfo } from './logger.js';

// Standard response formats
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  logInfo(`API Success: ${message}`, { statusCode, path: res.req?.path });
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, error, message = 'Error occurred', statusCode = 500) => {
  logError(`API Error: ${message}`, error, { 
    statusCode, 
    path: res.req?.path,
    method: res.req?.method 
  });
  
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

export const validationError = (res, errors, message = 'Validation failed') => {
  logError(`Validation Error: ${message}`, null, { errors, path: res.req?.path });
  return res.status(400).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  });
};

export const notFoundError = (res, message = 'Resource not found') => {
  return errorResponse(res, null, message, 404);
};

export const unauthorizedError = (res, message = 'Unauthorized') => {
  return errorResponse(res, null, message, 401);
};

export const forbiddenError = (res, message = 'Forbidden') => {
  return errorResponse(res, null, message, 403);
}; 