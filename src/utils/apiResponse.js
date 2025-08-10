

// Success Responses
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const createdResponse = (res, data, message = 'Resource created') => {
  return successResponse(res, data, message, 201);
};

const noContentResponse = (res) => {
  return res.status(204).json();
};

// Error Responses
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: errors.stack,
    timestamp: new Date().toISOString()
  });
};

const badRequestResponse = (res, message = 'Bad Request', errors = []) => {
  return errorResponse(res, message, 400, errors);
};

const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, 409);
};

const validationErrorResponse = (res, errors = [], message = 'Validation failed') => {
  return badRequestResponse(res, message, errors);
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse
};