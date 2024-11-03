import { Trim } from 'class-sanitizer';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
export class GettingStartedDTO {
	@IsPhoneNumber()
	@IsString()
	@IsNotEmpty()
	@Trim()
	phoneNumber: string | undefined;
}
