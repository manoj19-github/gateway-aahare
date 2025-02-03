import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from 'dotenv';
import express, { Application, Request, Response, json, urlencoded } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFound } from './http/middlewares/errorHandler.middleware';
import RoutesMain from './routes';
import { logger } from './utils/logger';
class ExpressApp {
	private app: Application;
	private PORT: unknown;
	private env: string;
	private routesMain = new RoutesMain();
	constructor() {
		this.env = process.env.NODE_ENV || 'development';
		config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });
		this.app = express();
		this.PORT = process.env.PORT ?? 5000;
		this.middleware();
		this.routes();
	}
	private middleware(): void {
		this.app.use(cors({ credentials: true, origin: '*', methods: 'GET,POST,PUT,DELETE' }));
		this.app.use(urlencoded({ extended: true, limit: '50mb' }));
		this.app.use(json({ limit: '50mb' }));
		this.app.use(helmet());
		this.app.use(cookieParser());
		this.app.use(compression());
		this.app.use(morgan('dev'));
		this.initializeSwagger();
	}
	private routes(): void {
		this.app.get('/', (req: Request, res: Response) => {
			return res.send('<h2>Server is running .....</h2>');
		});
		this.routesMain.initializeAllRoutes(this.app);

		// put this at the last of all routes

		this.app.use(errorHandler);
		this.app.use(notFound);
	}

	private initializeSwagger() {
		const options = {
			swaggerDefinition: {
				info: {
					title: 'REST API',
					version: '1.0.0',
					description: 'Example APIs for aahare'
				}
			},
			apis: ['swagger.yaml']
		};

		const specs = swaggerJSDoc(options);
		this.app.use('/api/aahare/docs', swaggerUi.serve, swaggerUi.setup(specs));
	}
	public listen(): void {
		// connectDB();
		this.app.listen(this.PORT, () => {
			logger.info(`=================================`);
			logger.info(`======= ENV: ${this.env} =======`);
			logger.info(`🚀GATEWAY APP LISTENING ON PORT ${this.PORT}`);
			logger.info(`=================================`);
		});
	}
}

const server = new ExpressApp();
server.listen();
