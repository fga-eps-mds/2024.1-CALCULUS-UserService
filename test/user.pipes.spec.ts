import { BadRequestException } from '@nestjs/common';
import { UsersValidationPipe } from 'src/users/pipes/users_validation.pipe';

describe('UsersValidationPipe', () => {
  let pipe: UsersValidationPipe;

  beforeEach(() => {
    pipe = new UsersValidationPipe();
  });

  describe('transform', () => {
    it('should throw BadRequestException if body is empty', () => {
      expect(() => pipe.transform(null, { type: 'body' })).toThrow(
        new BadRequestException('O corpo da requisição não pode estar vazio'),
      );
    });

    it('should not throw an exception if body is not empty', () => {
      expect(() =>
        pipe.transform({ name: 'John Doe' }, { type: 'body' }),
      ).not.toThrow();
    });

    it('should throw BadRequestException if query parameter is missing', () => {
      expect(() =>
        pipe.transform(null, { type: 'query', data: 'param' }),
      ).toThrow(
        new BadRequestException(
          "O parâmetro de consulta 'param' é obrigatório",
        ),
      );
    });

    it('should not throw an exception if query parameter is present', () => {
      expect(() =>
        pipe.transform('value', { type: 'query', data: 'param' }),
      ).not.toThrow();
    });

    it('should return the value if query parameter is present', () => {
      const result = pipe.transform('value', { type: 'query', data: 'param' });
      expect(result).toBe('value');
    });
  });
});
