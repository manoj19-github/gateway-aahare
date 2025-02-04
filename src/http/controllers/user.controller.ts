import { NextFunction, Request, Response } from 'express';
import { SendMailOptions } from 'nodemailer';
import otpMasterModel, { OTPMasterEnum } from '../../schema/otpMaster.schema';
import UserModel from '../../schema/user.schema';
import { UtilsMain } from '../../utils';
import { HttpException } from '../exceptions/http.exceptions';

export class UserController {
	static async generateOTPForLogin(req: Request, response: Response, next: NextFunction) {
		try {
			const { email } = req.body;
			const isUserExists = await UserModel.findOne({ email });
			if (!isUserExists) throw new HttpException(400, 'User not found');
			const loginOTP = UtilsMain.generateOTP();
			const mailOptions: SendMailOptions = UtilsMain.GetMailOptions({
				subject: `Dostbook OTP login`,
				to: isUserExists.email,
				expirationTime: 60,
				name: isUserExists.name,
				otp: loginOTP
			});
			UtilsMain.sendMailMethod(mailOptions)
				.then(async (res) => {
					await otpMasterModel.create({ otp: loginOTP, userId: isUserExists._id, genarateTime: Date.now(), type: OTPMasterEnum.userlogin });
					return response.status(200).json({ message: 'OTP sent successfully' });
				})
				.catch(() => {
					throw new HttpException(400, 'Something went wrong');
				});
		} catch (error) {
			next(error);
		}
	}
	static async verifyOTPForLogin(req: Request, response: Response, next: NextFunction) {
		try {
			const { otp, email } = req.body;
			const isUserExists = await UserModel.findOne({ email });
			if (!isUserExists) throw new HttpException(400, 'User not found');
			const otpMaster = await otpMasterModel.findOne({ otpVal: otp, userId: isUserExists._id, type: OTPMasterEnum.userlogin });
			if (!otpMaster) throw new HttpException(400, 'OTP not found');
			if (Date.now() - otpMaster.genarateTime.getTime() > 60000) throw new HttpException(400, 'OTP expired');
			await otpMasterModel.deleteOne({ _id: otpMaster._id });
			const { accessToken, refreshToken } = UtilsMain.generateToken(isUserExists._id);
			response.status(200).json({ accessToken, refreshToken, user: isUserExists });
		} catch (error) {
			next(error);
		}
	}
	static async gettingStarted(req: Request, response: Response, next: NextFunction) {
		try {
			const { phoneNumber } = req.body;
			const isUserExists = await UserModel.findOne({ phoneNumber });
			if (isUserExists) return response.status(200).json({ message: 'User already exists', navigateTo: 'LoginScreen' });
			return response.status(200).json({ message: `User does'nt exists`, navigateTo: 'RegisterScreen' });
		} catch (error) {
			next(error);
		}
	}

	static async registerHandler(req: Request, response: Response, next: NextFunction) {
		try {
			const { phoneNumber, name, email } = req.body;
			const isUserExists = await UserModel.findOne({ phoneNumber });
			if (isUserExists) throw new HttpException(400, 'User already exists');
			await UserModel.create({ phoneNumber, name, email });
			response.status(200).json({ message: 'Congratulations! You have successfully registered.' });
		} catch (error) {
			next(error);
		}
	}
	static async getUserByPhoneNumber(req: Request, response: Response, next: NextFunction) {
		try {
			const { phoneNumber } = req.params;
			const user = await UserModel.findOne({ phoneNumber });
			if (!user) throw new HttpException(400, 'User not found');
			response.status(200).json(user);
		} catch (error) {
			next(error);
		}
	}
	static async getUserById(req: Request, response: Response, next: NextFunction) {
		try {
			const { id } = req.params;
			const user = await UserModel.findById(id);
			if (!user) throw new HttpException(400, 'User not found');
			response.status(200).json(user);
		} catch (error) {
			next(error);
		}
	}
	static async reportFraud(req: Request, response: Response, next: NextFunction) {
		try {
			const { phoneNumber } = req.params;
			const user = await UserModel.findOne({ phoneNumber });
			if (!user) throw new HttpException(400, 'User not found');
			user.isFraudCount += 1;
			await user.save();
			return response.status(200).json(user);
		} catch (error) {
			next(error);
		}
	}
	static async getFraudUsers(req: Request, response: Response, next: NextFunction) {
		try {
			const users = await UserModel.find({ isFraudCount: { $gt: 0 } });
			return response.status(200).json(users);
		} catch (error) {
			next(error);
		}
	}
	static async addMultipleUsers(req: Request, response: Response, next: NextFunction) {
		try {
			const users = req.body;
			if (!Array.isArray(users)) throw new HttpException(400, 'Invalid request');
			const phoneNumbers = users.map((user) => user.phoneNumber);
			const isUserExists = await UserModel.find({ phoneNumber: { $in: phoneNumbers } }).select('phoneNumber');
			const existingPhoneNumbers = new Set(isUserExists.map((self) => self.phoneNumber));
			const operations = users
				.filter((self) => !existingPhoneNumbers.has(self.phoneNumber))
				.map((mUser) => ({
					updateOne: {
						filter: { phoneNumber: mUser.phoneNumber },
						update: { $set: mUser },
						upsert: true
					}
				}));
			if (operations.length === 0) return response.status(200).json({ message: 'All users already exists' });

			const result = await UserModel.collection.bulkWrite(operations);
			return response.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
}
