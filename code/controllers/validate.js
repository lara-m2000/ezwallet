export const validateObject = (yupSchema, objectToBeValidated) => {
  let validatedObject = {};
  let validationError = "default";
  let isValidationOk = true;

  try {
    validatedObject = yupSchema.validateSync(objectToBeValidated);
  } catch (e) {
    validationError = e.errors[0];
    isValidationOk = false;
  }

  return {
    validatedObject,
    isValidationOk,
    validationError,
  };
};

/**
 * Validate a req using yup schemas
 * -----
 * @param req the request object
 * @param paramsSchema the yup schema targeting the req.params
 * @param bodySchema the yup schema targeting the req.body
 * @param querySchema the yup schema targeting the req.query
 *
 * Make use of this utility to validate a request.
 * You can optionally choose to validate only the payload (req.body) and/or the parameters (req.params)
 * If the schema is not suited the validation will be skipped so it is your responsibility to provide a not-empty schema
 * @see validateObject
 */

export const validateRequest = (req, paramsSchema, bodySchema, querySchema) => {
  let isValidationOk = true;
  let params = {};
  let body = {};
  let query = {};
  let errorMessages = [];

  if (yup.isSchema(paramsSchema)) {
    const params_res = validateObject(paramsSchema, req.params);
    if (params_res.isValidationOk) {
      params = { ...params_res.validatedObject };
    } else {
      errorMessages.push(params_res.validationError);
      isValidationOk = false;
    }
  }

  if (yup.isSchema(bodySchema)) {
    const body_res = validateObject(bodySchema, req.body);
    if (body_res.isValidationOk) {
      body = { ...body_res.validatedObject };
    } else {
      errorMessages.push(body_res.validationError);
      isValidationOk = false;
    }
  }

  if (yup.isSchema(querySchema)) {
    const query_res = validateObject(querySchema, req.query);
    if (query_res.isValidationOk) {
      query = { ...query_res.validatedObject };
    } else {
      errorMessages.push(query_res.validationError);
      isValidationOk = false;
    }
  }

  const errorMessage = errorMessages[0] ?? undefined; //returns the first error or undefined

  return {
    params,
    body,
    query,
    isValidationOk,
    errorMessage,
  };
};