import bcrypt from "bcryptjs";



export const hashPassword = async (password) => {
    return await bcrypt.hash(password, Number(process.env.SALT_ROUNDS))
}

export const comparePassword = async (password,hash) =>{
    return await bcrypt.compare(password,hash)
}