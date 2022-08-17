import jwtDecode from "jwt-decode";

import type {JwtPayload} from "jwt-decode";

const decodeJwt = (token: string): JwtPayload => {
    let encodedString: string = token.replace('Bearer ', '');
    return jwtDecode<JwtPayload>(encodedString);
}

export {decodeJwt}
