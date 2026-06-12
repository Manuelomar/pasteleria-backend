import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Error interno del servidor';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
                message = (exceptionResponse as any).message;
            } else {
                message = exception.message;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        // Translate common English messages from Passport/TypeORM to Spanish
        if (typeof message === 'string') {
            if (message === 'Unauthorized') message = 'No autorizado. Inicie sesión nuevamente.';
            if (message.includes('duplicate key')) message = 'Ya existe un registro con esos datos.';
        }

        // Standardized Error Response
        response.status(status).json({
            success: false,
            status: status,
            message: message,
            data: null,
            path: request.url, // Optional but helpful for debugging
            timestamp: new Date().toISOString()
        });
    }
}
