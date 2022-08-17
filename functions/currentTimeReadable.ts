export const currentTimeReadable = (): string => {
    let date_obj = new Date();
    return `${date_obj.getUTCFullYear()}-${('0' + (date_obj.getUTCMonth() + 1)).slice(-2)}-${('0' + date_obj.getUTCDate()).slice(-2)} ${('0' + date_obj.getUTCHours()).slice(-2)}:${('0' + date_obj.getUTCMinutes()).slice(-2)}:${('0' + date_obj.getUTCSeconds()).slice(-2)}`;
};
