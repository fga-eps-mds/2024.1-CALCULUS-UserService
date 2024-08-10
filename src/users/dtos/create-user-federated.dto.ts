import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDtoFederated {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  username: string;

  password?: string;
}
