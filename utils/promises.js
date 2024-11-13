
export const ValidateObj = (object, schema) => {
    return new Promise((resolve, reject) => {
        const validate = (object, schema) => Object
            .keys(schema)
            .filter(key => !schema[key](object[key]))
            .map(key => new Error(`Required ${key} and must be valid.`));

        const errors = validate(object, schema);

        if (errors.length > 0) {
            for (const { message } of errors) {
                reject({ message: message, status: false });
            }
        } else {
            resolve(true)
        }
    })
}