import 'dotenv/config'
import * as joi from 'joi'

interface EnvVars {
    PORT: number;
    NATS_SERVICE: string;
    JWT_SERVICE: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    CLOUDINARY_FOLDER: string;
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    NATS_SERVICE: joi.string().required(),
    JWT_SERVICE: joi.string().required(),
    CLOUDINARY_CLOUD_NAME: joi.string().allow('').optional(),
    CLOUDINARY_API_KEY: joi.string().allow('').optional(),
    CLOUDINARY_API_SECRET: joi.string().allow('').optional(),
    CLOUDINARY_FOLDER: joi.string().default('centinela'),
})
.unknown(true);

const {error , value } = envsSchema.validate({
    ...process.env,
})

if(error){
    throw new Error (`Error en la configuracion de la validacion ${error.message}`)
}

const envVars : EnvVars = value

export const envs = {
    port: envVars.PORT,
    natsServers: [envVars.NATS_SERVICE],
    jwtService: envVars.JWT_SERVICE,
    cloudinary: {
        cloudName: envVars.CLOUDINARY_CLOUD_NAME,
        apiKey: envVars.CLOUDINARY_API_KEY,
        apiSecret: envVars.CLOUDINARY_API_SECRET,
    },
    cloudinaryFolder: envVars.CLOUDINARY_FOLDER || 'centinela',
}
