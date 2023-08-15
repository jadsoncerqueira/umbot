import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  // console.log(token);
  res.cookie("jrt", token, {
    httpOnly: false,
    domain: ".onrender.com"
  });
};
