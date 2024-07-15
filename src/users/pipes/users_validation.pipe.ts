import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';

export class UsersValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      if (!value) {
        throw new BadRequestException(
          `O corpo da requisição não pode estar vazio`,
        );
      }
    } else if (metadata.type === 'query') {
      if (!value) {
        throw new BadRequestException(
          `O parâmetro de consulta '${metadata.data}' é obrigatório`,)
      
      
    }
    
    return value;
  }
}
}
