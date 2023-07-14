import bcrypt from 'bcrypt'


const generateSaltSync = (rounds = 10) => {
    const salt = bcrypt.genSaltSync(rounds)
    return salt
}

const sha256Sync = async (password, salt = '') => {
    //return crypto.createHash('sha256').update(data + salt, 'binary').digest('base64');
    const data = await bcrypt.hash(password, salt)
    return data
}

const sha256wSalt = (data, rounds, cb) => {
    const salt = generateSaltSync(rounds)
    bcrypt.hash(data, salt).then((hash) => cb({ hash, salt }))
}


const sha256wSaltSync = async (data, rounds = 10) => {
    const salt = generateSaltSync(rounds);
    const hash = await bcrypt.hash(data, salt);
    return {
        hash,
        salt
    }
}




export { sha256Sync, sha256wSalt, sha256wSaltSync, generateSaltSync }
