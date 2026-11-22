// Owner: M2  — reusable Zod body / query validator middleware
// Usage:  router.post('/route', validate(myZodSchema), handler)
//         router.get('/route',  validate(myZodSchema, 'query'), handler)

/**
 * Returns an Express middleware that validates req[source] against a Zod schema.
 * On success  → replaces req[source] with the parsed (coerced) data and calls next().
 * On failure  → responds 400 with the first error message.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source  default 'body'
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path  = issue.path.join('.') || source;
    return res.status(400).json({ success: false, message: `${path}: ${issue.message}` });
  }
  req[source] = result.data;
  return next();
};

export default validate;
