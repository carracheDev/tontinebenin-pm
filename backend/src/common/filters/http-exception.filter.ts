import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Une erreur est survenue.';
    let code: string | undefined;
    if (exception instanceof HttpException) {
      const r = exception.getResponse() as any;
      message = r?.message ?? exception.message;
      code = r?.code;
      if (Array.isArray(message)) message = message[0];
    }
    res.status(status).json({ succes: false, message, code });
  }
}
