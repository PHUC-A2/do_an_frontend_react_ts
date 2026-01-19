export interface ILogin {
    username: string;
    password: string;
}


export interface IRegister {
    email: string;
    password: string;
}

/**
 * {
    "statusCode": 201,
    "error": null,
    "message": "Đăng ký tài khoản",
    "data": {
        "message": "Đăng ký tài khoản thành công"
    }
}

{
    "statusCode": 400,
    "error": "Email không hợp lệ",
    "message": "Email: user_07@gmail.com đã tồn tại",
    "data": null
}
 * 
 */