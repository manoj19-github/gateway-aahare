import { Trim } from 'class-sanitizer';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';
export class RegistrationDTO {
	@IsString()
	@Trim()
	@IsNotEmpty()
	@MinLength(4, { message: 'Name should be minimum of 4 characters' })
	name: string | undefined;
	@IsEmail({}, { message: 'Provided Email is not valid' })
	@IsNotEmpty()
	@Trim()
	email: string | undefined;
	@IsPhoneNumber()
	@IsString()
	@IsNotEmpty()
	@Trim()
	phoneNumber: string | undefined;
}
